const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const escapeAttribute = escapeHtml;

function safeUrl(value, { image = false } = {}) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^(?:https?:\/\/|\/|\.\.?\/|#)/i.test(url)) return escapeAttribute(url);
  if (!image && /^(?:mailto:|tel:)/i.test(url)) return escapeAttribute(url);
  return "";
}

function splitTableRow(line) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells = [];
  let current = "";
  let escaped = false;
  for (const character of trimmed) {
    if (character === "|" && !escaped) {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
    escaped = character === "\\" && !escaped;
    if (character !== "\\") escaped = false;
  }
  cells.push(current.trim());
  return cells;
}

function isTableDivider(line) {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function slugify(value) {
  return String(value)
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "")
    .trim()
    .toLocaleLowerCase("zh-CN")
    .replace(/[^\p{Letter}\p{Number}\u4e00-\u9fff]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function extractDefinitions(markdown) {
  const references = new Map();
  const footnotes = new Map();
  const output = [];
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const footnote = line.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
    if (footnote) {
      const body = [footnote[2]];
      while (index + 1 < lines.length && /^(?: {2,}|\t)\S/.test(lines[index + 1])) {
        body.push(lines[index + 1].trim());
        index += 1;
      }
      footnotes.set(footnote[1].toLocaleLowerCase(), body.join(" "));
      continue;
    }

    const reference = line.match(/^\[([^\]^]+)\]:\s*(\S+)(?:\s+["']([^"']+)["'])?\s*$/);
    if (reference) {
      references.set(reference[1].toLocaleLowerCase(), {
        url: reference[2],
        title: reference[3] || "",
      });
      continue;
    }
    output.push(line);
  }

  return { markdown: output.join("\n"), references, footnotes };
}

function createInlineRenderer({ references, footnoteOrder }) {
  return function inlineMarkdown(value) {
    const tokens = [];
    const store = (html) => {
      const token = `\u0000INLINE${tokens.length}\u0000`;
      tokens.push(html);
      return token;
    };
    const renderEmphasis = (content) => escapeHtml(content)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_]+)__/g, "<strong>$1</strong>")
      .replace(/~~([^~]+)~~/g, "<del>$1</del>")
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");

    let source = String(value);

    source = source.replace(/`([^`]+)`/g, (_, code) => store(`<code>${escapeHtml(code)}</code>`));

    source = source.replace(/<(br\s*\/?)>/gi, () => store("<br>"));
    // Keep the inline HTML allowlist deliberately narrow: supported tags may
    // not carry attributes, so Markdown content cannot inject event handlers.
    source = source.replace(/<(\/?(?:kbd|mark|u))>/gi, (_, tag) => store(`<${tag.toLocaleLowerCase()}>`));

    source = source.replace(/!\[([^\]]*)\]\((\S+?)(?:\s+["']([^"']*)["'])?\)/g, (_, alt, url, title) => {
      const src = safeUrl(url, { image: true });
      if (!src) return store(`<span class="unsupported-format">不安全的图片地址</span>`);
      const titleAttribute = title ? ` title="${escapeAttribute(title)}"` : "";
      return store(`<img src="${src}" alt="${escapeAttribute(alt)}" loading="lazy" decoding="async"${titleAttribute}>`);
    });

    source = source.replace(/!\[([^\]]*)\]\[([^\]]+)\]/g, (match, alt, id) => {
      const reference = references.get(id.toLocaleLowerCase());
      if (!reference) return match;
      const src = safeUrl(reference.url, { image: true });
      if (!src) return store(`<span class="unsupported-format">不安全的图片地址</span>`);
      const titleAttribute = reference.title ? ` title="${escapeAttribute(reference.title)}"` : "";
      return store(`<img src="${src}" alt="${escapeAttribute(alt)}" loading="lazy" decoding="async"${titleAttribute}>`);
    });

    const link = (label, url, title = "") => {
      const href = safeUrl(url);
      if (!href) return renderEmphasis(label);
      const external = /^https?:\/\//i.test(url);
      const attributes = `${external ? ' target="_blank" rel="noreferrer"' : ""}${title ? ` title="${escapeAttribute(title)}"` : ""}`;
      return store(`<a href="${href}"${attributes}>${renderEmphasis(label)}</a>`);
    };

    source = source.replace(/\[([^\]]+)\]\((\S+?)(?:\s+["']([^"']*)["'])?\)/g, (_, label, url, title) => link(label, url, title));
    source = source.replace(/\[([^\]]+)\]\[([^\]]+)\]/g, (match, label, id) => {
      const reference = references.get(id.toLocaleLowerCase());
      return reference ? link(label, reference.url, reference.title) : match;
    });

    source = source.replace(/\[\^([^\]]+)\]/g, (match, id) => {
      const normalized = id.toLocaleLowerCase();
      let number = footnoteOrder.indexOf(normalized) + 1;
      if (!number) {
        footnoteOrder.push(normalized);
        number = footnoteOrder.length;
      }
      return store(`<sup class="footnote-ref"><a id="fnref-${escapeAttribute(normalized)}" href="#fn-${escapeAttribute(normalized)}" aria-label="脚注 ${number}">[${number}]</a></sup>`);
    });

    source = renderEmphasis(source);

    return source.replace(/\u0000INLINE(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
  };
}

function renderTable(lines, inlineMarkdown) {
  const headers = splitTableRow(lines[0]);
  const dividers = splitTableRow(lines[1]);
  const alignments = dividers.map((cell) => {
    if (cell.startsWith(":") && cell.endsWith(":")) return "center";
    if (cell.endsWith(":")) return "right";
    return "left";
  });
  const body = lines.slice(2).map(splitTableRow);
  const cell = (tag, value, index) => `<${tag} style="text-align:${alignments[index] || "left"}">${inlineMarkdown(value || "")}</${tag}>`;
  return `<div class="table-scroll"><table><thead><tr>${headers.map((value, index) => cell("th", value, index)).join("")}</tr></thead>${body.length ? `<tbody>${body.map((row) => `<tr>${headers.map((_, index) => cell("td", row[index], index)).join("")}</tr>`).join("")}</tbody>` : ""}</table></div>`;
}

const languageKeywords = {
  javascript: new Set(["async", "await", "break", "case", "catch", "class", "const", "continue", "default", "delete", "do", "else", "export", "extends", "finally", "for", "from", "function", "if", "import", "in", "instanceof", "let", "new", "of", "return", "static", "switch", "throw", "try", "typeof", "var", "while", "yield"]),
  typescript: new Set(["abstract", "any", "as", "async", "await", "boolean", "class", "const", "declare", "else", "enum", "export", "extends", "for", "from", "function", "if", "implements", "import", "in", "interface", "keyof", "let", "namespace", "never", "new", "number", "of", "private", "protected", "public", "readonly", "return", "satisfies", "static", "string", "type", "typeof", "unknown", "void", "while"]),
  python: new Set(["and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield"]),
  shell: new Set(["case", "do", "done", "elif", "else", "esac", "export", "fi", "for", "function", "if", "in", "local", "return", "then", "while"]),
  powershell: new Set(["begin", "break", "catch", "class", "continue", "data", "do", "dynamicparam", "else", "elseif", "end", "enum", "exit", "filter", "finally", "for", "foreach", "from", "function", "if", "in", "param", "process", "return", "switch", "throw", "trap", "try", "until", "using", "while"]),
};

function normalizeLanguage(language) {
  const aliases = { js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript", py: "python", bash: "shell", sh: "shell", zsh: "shell", ps1: "powershell", pwsh: "powershell" };
  const normalized = String(language || "").toLocaleLowerCase();
  return aliases[normalized] || normalized;
}

function languageLabel(language) {
  const labels = {
    ascii: "ASCII",
    css: "CSS",
    html: "HTML",
    javascript: "JavaScript",
    json: "JSON",
    markdown: "Markdown",
    powershell: "PowerShell",
    python: "Python",
    shell: "Shell",
    sql: "SQL",
    text: "文本",
    typescript: "TypeScript",
    xml: "XML",
    yaml: "YAML",
  };
  const normalized = normalizeLanguage(language);
  return labels[normalized] || (normalized ? normalized.toLocaleUpperCase() : "代码");
}

function parseFenceInfo(value) {
  const source = String(value || "").trim();
  if (!source) return { kind: "code", language: "", label: "代码" };

  // 围栏首词既可能是代码语言，也可能是迁移文章中的中文展示标签。
  // 使用“非空白字符”而不是 \w，避免“流程”“示意图”等中文被解析失败。
  const match = source.match(/^(\S+)(?:\s+([\s\S]+))?$/u);
  if (!match) return { kind: "code", language: "text", label: source };

  const language = match[1];
  const metadata = (match[2] || "").trim();
  const attribute = metadata.match(/^\{?\s*(?:label|lable|title|model)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^}\s]+))\s*\}?$/i);
  const rawLabel = attribute ? (attribute[1] ?? attribute[2] ?? attribute[3] ?? "") : metadata;
  const label = rawLabel.trim().replace(/^(["'])|(["'])$/g, "");
  const normalized = normalizeLanguage(language);

  // prompt 是独立的内容组件；同时兼容旧文章已经写下的中文“提示词”围栏。
  if (normalized === "prompt" || language === "提示词") {
    return { kind: "prompt", language: "", label: label || "Prompt" };
  }

  // React 用于展示 AI 的回应；中文“回应”作为迁移内容的兼容别名。
  if (normalized === "react" || language === "回应") {
    const shorthand = metadata.match(/^(?:label|lable|model)[-:]\s*(gpt|chatgpt|openai|claude|gemini)$/i);
    const modelSource = shorthand?.[1] || (attribute ? label : "");
    const modelKey = modelSource.toLocaleLowerCase();
    const model = /^(?:gpt|chatgpt|openai)$/.test(modelKey)
      ? "gpt"
      : /^(?:claude|gemini)$/.test(modelKey)
        ? modelKey
        : "";
    return {
      kind: "react",
      language: "",
      label: model ? "" : (label || "React"),
      model,
    };
  }

  // 单独的中文首词不是语法高亮语言，而是作者希望展示的工具栏标签。
  if (/\p{Script=Han}/u.test(language)) {
    return { kind: "code", language: "text", label: metadata ? source : language };
  }

  // “ASCII 图”沿用 ASCII 文本渲染，同时把完整短语显示为标签。
  if (normalized === "ascii" && metadata && !attribute) {
    return { kind: "code", language, label: `${languageLabel(language)} ${label}` };
  }

  return { kind: "code", language, label: label || languageLabel(language) };
}

function highlightCode(source, language) {
  const normalized = normalizeLanguage(language);
  const keywords = languageKeywords[normalized] || new Set();
  const hashComments = new Set(["python", "shell", "powershell", "yaml", "yml"]);
  const slashComments = new Set(["javascript", "typescript", "java", "c", "cpp", "csharp", "go", "rust", "swift", "kotlin"]);
  const constants = new Set(["true", "false", "null", "undefined", "none", "True", "False", "None"]);
  const token = (type, value) => `<span class="token token-${type}">${escapeHtml(value)}</span>`;
  let html = "";
  let index = 0;

  while (index < source.length) {
    const rest = source.slice(index);
    if ((normalized === "html" || normalized === "xml") && rest.startsWith("<")) {
      const end = source.indexOf(">", index + 1);
      if (end >= 0) {
        html += token("tag", source.slice(index, end + 1));
        index = end + 1;
        continue;
      }
    }
    if ((slashComments.has(normalized) && rest.startsWith("//")) || (hashComments.has(normalized) && rest.startsWith("#"))) {
      const end = source.indexOf("\n", index);
      const stop = end < 0 ? source.length : end;
      html += token("comment", source.slice(index, stop));
      index = stop;
      continue;
    }
    if (rest.startsWith("/*")) {
      const end = source.indexOf("*/", index + 2);
      const stop = end < 0 ? source.length : end + 2;
      html += token("comment", source.slice(index, stop));
      index = stop;
      continue;
    }

    const character = source[index];
    if (character === '"' || character === "'" || character === "`") {
      const quote = character;
      let stop = index + 1;
      while (stop < source.length) {
        if (source[stop] === "\\") stop += 2;
        else if (source[stop++] === quote) break;
      }
      const value = source.slice(index, stop);
      const whitespace = source.slice(stop).match(/^\s*/)?.[0].length || 0;
      const type = normalized === "json" && source[stop + whitespace] === ":" ? "property" : "string";
      html += token(type, value);
      index = stop;
      continue;
    }

    const number = rest.match(/^(?:0x[\da-f]+|\d+(?:\.\d+)?)/i);
    if (number) {
      html += token("number", number[0]);
      index += number[0].length;
      continue;
    }

    const identifier = rest.match(/^[A-Za-z_$][\w$-]*/);
    if (identifier) {
      const value = identifier[0];
      if (keywords.has(value)) html += token("keyword", value);
      else if (constants.has(value)) html += token("constant", value);
      else html += escapeHtml(value);
      index += value.length;
      continue;
    }

    html += escapeHtml(character);
    index += 1;
  }
  return html;
}

function renderCodeBlock(code, language, label = "") {
  const normalized = normalizeLanguage(language);
  const languageClass = normalized ? ` class="language-${escapeAttribute(normalized)}"` : "";
  const languageAttribute = normalized ? ` data-language="${escapeAttribute(normalized)}"` : "";
  const visibleLabel = label || languageLabel(normalized);
  return `<div class="code-block">
    <div class="code-toolbar">
      <div class="toolbar-left"><span class="toolbar-label">${escapeHtml(visibleLabel)}</span></div>
      <div class="toolbar-right">${renderCopyButton()}</div>
    </div>
    <pre${languageAttribute}><code${languageClass} data-copy-source>${highlightCode(code, normalized)}</code></pre>
  </div>`;
}

function renderCopyButton() {
  return `<button class="inline-prompt-copy-btn" title="Copy prompt">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="8" width="12" height="12" rx="2" ry="2"></rect>
            <path d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"></path>
          </svg>
    </button>`;
}

const dialogueModels = {
  gpt: {
    label: "GPT",
    icon: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/chatgpt-icon.svg",
  },
  claude: {
    label: "Claude",
    icon: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/claude-ai-icon.svg",
  },
  gemini: {
    label: "Gemini",
    icon: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/google-gemini-icon.svg",
  },
};

function renderDialogueMark(kind, model = "") {
  const modelConfig = kind === "react" ? dialogueModels[model] : null;
  if (modelConfig) {
    return `<img class="prompt-model-icon" src="${modelConfig.icon}" alt="" width="17" height="17" loading="lazy" decoding="async">`;
  }
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>`;
}

function renderDialogueBlock(content, kind = "prompt", label = "", model = "") {
  const modelConfig = dialogueModels[model];
  const defaultLabel = kind === "react" ? "React" : "Prompt";
  const normalizedLabel = label.toLocaleLowerCase() === defaultLabel.toLocaleLowerCase()
    ? defaultLabel
    : label;
  const visibleLabel = modelConfig?.label || normalizedLabel || defaultLabel;
  const variantClass = kind === "react" ? " react-block" : "";
  return `<section class="prompt-block${variantClass}" aria-label="${escapeAttribute(visibleLabel)}">
    <div class="prompt-toolbar">
      <div class="prompt-heading"><span class="prompt-mark" aria-hidden="true">${renderDialogueMark(kind, model)}</span><span>${escapeHtml(visibleLabel)}</span></div>
      ${renderCopyButton()}
    </div>
    <div class="prompt-content" data-copy-source>${escapeHtml(content)}</div>
  </section>`;
}

function renderFenceBlock(content, kind, language, label, model = "") {
  return kind === "prompt" || kind === "react"
    ? renderDialogueBlock(content, kind, label, model)
    : renderCodeBlock(content, language, label);
}

function joinParagraphLines(lines) {
  return lines.map((line, index) => {
    const isLast = index === lines.length - 1;
    const hasHardBreak = /(?: {2,}|\\)$/.test(line);
    const content = hasHardBreak ? line.replace(/(?: {2,}|\\)$/, "") : line;
    return `${content}${isLast ? "" : hasHardBreak ? "<br>" : " "}`;
  }).join("");
}

function renderList(lines, inlineMarkdown, context) {
  const stack = [];
  let html = "";
  const openList = (item) => item.type === "ol" && item.start !== 1
    ? `<ol start="${item.start}">`
    : `<${item.type}>`;
  const itemHtml = (content) => {
    const task = content.match(/^\[([ xX])\]\s+(.+)$/);
    if (!task) return `<li>${inlineMarkdown(content)}`;
    return `<li class="task-list-item"><input type="checkbox" disabled${task[1].toLocaleLowerCase() === "x" ? " checked" : ""}> ${inlineMarkdown(task[2])}`;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const quote = lines[index].match(/^(\s{2,})>\s?(.*)$/);
    if (quote) {
      const quoteIndent = quote[1].replaceAll("\t", "  ").length;
      while (stack.length > 1 && quoteIndent <= stack.at(-1).indent) {
        const level = stack.pop();
        html += `</li></${level.type}>`;
      }

      const quoteLines = [];
      while (index < lines.length) {
        const nestedQuote = lines[index].match(/^(\s{2,})>\s?(.*)$/);
        if (!nestedQuote) break;
        quoteLines.push(nestedQuote[2]);
        index += 1;
      }
      index -= 1;
      html += `<blockquote>${renderMarkdown(quoteLines.join("\n"), { ...context, appendFootnotes: false }).html}</blockquote>`;
      continue;
    }

    const match = lines[index].match(/^(\s*)([-*+]|\d+[.)])\s+(.+)$/);
    if (!match) continue;
    const ordered = /^\d/.test(match[2]);
    const item = {
      indent: match[1].replaceAll("\t", "  ").length,
      type: ordered ? "ol" : "ul",
      start: ordered ? Number.parseInt(match[2], 10) : null,
      content: match[3],
    };
    if (!stack.length) {
      html += `${openList(item)}${itemHtml(item.content)}`;
      stack.push({ indent: item.indent, type: item.type });
      continue;
    }

    while (stack.length && item.indent < stack.at(-1).indent) {
      const level = stack.pop();
      html += `</li></${level.type}>`;
    }

    const current = stack.at(-1);
    if (item.indent > current.indent) {
      html += `${openList(item)}${itemHtml(item.content)}`;
      stack.push({ indent: item.indent, type: item.type });
    } else if (item.type === current.type) {
      html += `</li>${itemHtml(item.content)}`;
    } else {
      html += `</li></${current.type}>${openList(item)}${itemHtml(item.content)}`;
      stack[stack.length - 1] = { indent: item.indent, type: item.type };
    }
  }

  while (stack.length) {
    const level = stack.pop();
    html += `</li></${level.type}>`;
  }
  return html;
}

function renderShortcodes(markdown, context) {
  const blocks = [];
  const store = (html) => {
    const token = `@@HUGO_BLOCK_${blocks.length}@@`;
    blocks.push(html);
    return `\n${token}\n`;
  };

  let source = markdown.replace(
    /\{\{%\s*notice\s+([^\s%}]+)(?:\s+["']([^"']*)["'])?\s*%\}\}([\s\S]*?)\{\{%\s*\/notice\s*%\}\}/gi,
    (_, type, title, body) => {
      const allowedType = /^(?:content|info|warning|success|danger)$/.test(type) ? type : "content";
      const inner = renderMarkdown(body.trim(), { ...context, appendFootnotes: false }).html;
      return store(`<fieldset class="notice-box notice-${allowedType}"><legend>${escapeHtml(title || "提示")}</legend><div class="notice-body">${inner}</div></fieldset>`);
    },
  );

  source = source.replace(/\{\{<\s*imgloop\s+["']([^"']+)["']\s*>\}\}/gi, (_, value) => {
    const images = value.split(",").map((url) => url.trim()).filter(Boolean);
    const items = images.map((url, index) => {
      const src = safeUrl(url, { image: true });
      return src ? `<figure><img src="${src}" alt="轮播图片 ${index + 1}" loading="lazy" decoding="async"><figcaption>${index + 1} / ${images.length}</figcaption></figure>` : "";
    }).filter(Boolean);
    return store(`<div class="image-loop" role="region" aria-label="图片集">${items.join("")}</div>`);
  });

  source = source.replace(/\{\{[<%][\s\S]*?[>%]\}\}/g, (shortcode) => {
    context.warnings?.push(`尚未兼容的 Hugo 短代码：${shortcode.replace(/\s+/g, " ")}`);
    return store(`<aside class="unsupported-format"><strong>未兼容格式</strong><code>${escapeHtml(shortcode)}</code></aside>`);
  });

  return { source, blocks };
}

export function renderMarkdown(markdown, options = {}) {
  const context = {
    warnings: options.warnings || [],
    appendFootnotes: options.appendFootnotes !== false,
  };
  const extracted = extractDefinitions(String(markdown).replace(/<!--([\s\S]*?)-->/g, ""));
  const footnoteOrder = [];
  const inlineMarkdown = createInlineRenderer({ references: extracted.references, footnoteOrder });
  const shortcodeResult = renderShortcodes(extracted.markdown, context);
  const lines = shortcodeResult.source.split("\n");
  const html = [];
  const headingIds = new Map();
  let paragraph = [];
  let listType = null;
  let inCode = false;
  let code = [];
  let codeLanguage = "";
  let codeLabel = "";
  let codeKind = "code";
  let codeModel = "";

  const flushParagraph = () => {
    if (paragraph.length) html.push(`<p>${inlineMarkdown(joinParagraphLines(paragraph))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (listType) html.push(`</${listType}>`);
    listType = null;
  };
  const flushAll = () => {
    flushParagraph();
    closeList();
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = line.match(/^```([\s\S]*)$/);
    if (fence) {
      flushAll();
      if (inCode) {
        const content = code.join("\n");
        html.push(renderFenceBlock(content, codeKind, codeLanguage, codeLabel, codeModel));
        code = [];
        codeLanguage = "";
        codeLabel = "";
        codeKind = "code";
        codeModel = "";
      } else {
        const info = parseFenceInfo(fence[1]);
        codeKind = info.kind;
        codeLanguage = info.language;
        codeLabel = info.label;
        codeModel = info.model || "";
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }

    const shortcodeBlock = line.match(/^@@HUGO_BLOCK_(\d+)@@$/);
    if (shortcodeBlock) {
      flushAll();
      html.push(shortcodeResult.blocks[Number(shortcodeBlock[1])]);
      continue;
    }

    if (!line.trim()) {
      flushAll();
      continue;
    }

    if (line.includes("|") && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      flushAll();
      const tableLines = [line, lines[index + 1]];
      index += 2;
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        tableLines.push(lines[index]);
        index += 1;
      }
      index -= 1;
      html.push(renderTable(tableLines, inlineMarkdown));
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      const baseId = slugify(heading[2]);
      const occurrence = headingIds.get(baseId) || 0;
      headingIds.set(baseId, occurrence + 1);
      const id = occurrence ? `${baseId}-${occurrence + 1}` : baseId;
      html.push(`<h${level} id="${escapeAttribute(id)}">${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    if (/^ {0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushAll();
      html.push("<hr>");
      continue;
    }

    if (/^<details(?:\s+open)?>\s*$/i.test(line.trim())) {
      flushAll();
      html.push(line.toLocaleLowerCase().includes("open") ? "<details open>" : "<details>");
      continue;
    }
    if (/^<\/details>\s*$/i.test(line.trim())) {
      flushAll();
      html.push("</details>");
      continue;
    }
    const summary = line.trim().match(/^<summary>([\s\S]*?)<\/summary>$/i);
    if (summary) {
      flushAll();
      html.push(`<summary>${inlineMarkdown(summary[1])}</summary>`);
      continue;
    }
    if (/^<center>\s*$/i.test(line.trim())) {
      flushAll();
      html.push('<div class="text-center">');
      continue;
    }
    if (/^<\/center>\s*$/i.test(line.trim())) {
      flushAll();
      html.push("</div>");
      continue;
    }

    const standaloneImage = line.trim().match(/^!\[([^\]]*)\]\((\S+?)(?:\s+["']([^"']*)["'])?\)$/);
    if (standaloneImage) {
      flushAll();
      const image = inlineMarkdown(line.trim());
      const caption = standaloneImage[1] ? `<figcaption>${inlineMarkdown(standaloneImage[1])}</figcaption>` : "";
      html.push(`<figure class="markdown-image">${image}${caption}</figure>`);
      continue;
    }

    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushAll();
      const listLines = [line];
      const listPattern = /^\s*(?:[-*+]|\d+[.)])\s+.+$/;
      const nestedQuotePattern = /^\s{2,}>\s?.*$/;
      let cursor = index + 1;
      while (cursor < lines.length) {
        if (listPattern.test(lines[cursor]) || nestedQuotePattern.test(lines[cursor])) {
          listLines.push(lines[cursor]);
          cursor += 1;
          continue;
        }

        if (!lines[cursor].trim()) {
          let nextItem = cursor + 1;
          while (nextItem < lines.length && !lines[nextItem].trim()) nextItem += 1;
          if (
            nextItem < lines.length
            && (listPattern.test(lines[nextItem]) || nestedQuotePattern.test(lines[nextItem]))
          ) {
            cursor = nextItem;
            continue;
          }
        }
        break;
      }
      index = cursor - 1;
      html.push(renderList(listLines, inlineMarkdown, context));
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushAll();
      const quoteLines = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      index -= 1;
      html.push(`<blockquote>${renderMarkdown(quoteLines.join("\n"), { ...context, appendFootnotes: false }).html}</blockquote>`);
      continue;
    }

    // 仅移除段首空白，保留行尾的两个空格，以支持 Markdown 硬换行。
    paragraph.push(line.trimStart());
  }

  flushAll();
  if (code.length) {
    context.warnings.push("存在未闭合的 Markdown 代码围栏，已按代码块渲染到文末。");
    const content = code.join("\n");
    html.push(renderFenceBlock(content, codeKind, codeLanguage, codeLabel, codeModel));
  }

  if (context.appendFootnotes && footnoteOrder.length) {
    const items = footnoteOrder.map((id, index) => {
      const body = extracted.footnotes.get(id);
      if (!body) context.warnings.push(`脚注 [^${id}] 没有对应定义。`);
      return `<li id="fn-${escapeAttribute(id)}"><span class="footnote-number" aria-hidden="true">[${index + 1}]</span>${inlineMarkdown(body || `缺少脚注定义：${id}`)} <a class="footnote-backref" href="#fnref-${escapeAttribute(id)}" aria-label="返回正文">&#8617;&#65038;</a></li>`;
    });
    html.push(`<section class="footnotes" aria-label="脚注"><hr><ol>${items.join("")}</ol></section>`);
  }

  return { html: html.join("\n"), warnings: context.warnings };
}

export function hasMath(markdown) {
  const source = String(markdown)
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "");
  return /\$\$[\s\S]+?\$\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]|\$(?!\s)[^$\n]+?(?<!\s)\$/.test(source);
}
