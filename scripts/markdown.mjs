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

    let source = String(value);

    source = source.replace(/`([^`]+)`/g, (_, code) => store(`<code>${escapeHtml(code)}</code>`));

    source = source.replace(/<(br\s*\/?)>/gi, () => store("<br>"));
    source = source.replace(/<(\/?(?:kbd|mark))>/gi, (_, tag) => store(`<${tag.toLocaleLowerCase()}>`));

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
      if (!href) return escapeHtml(label);
      const external = /^https?:\/\//i.test(url);
      const attributes = `${external ? ' target="_blank" rel="noreferrer"' : ""}${title ? ` title="${escapeAttribute(title)}"` : ""}`;
      return store(`<a href="${href}"${attributes}>${escapeHtml(label)}</a>`);
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
      return store(`<sup class="footnote-ref"><a id="fnref-${escapeAttribute(normalized)}" href="#fn-${escapeAttribute(normalized)}" aria-label="脚注 ${number}">${number}</a></sup>`);
    });

    source = escapeHtml(source)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_]+)__/g, "<strong>$1</strong>")
      .replace(/~~([^~]+)~~/g, "<del>$1</del>")
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");

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

  const flushParagraph = () => {
    if (paragraph.length) html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
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
    const fence = line.match(/^```\s*([\w+-]*)\s*$/);
    if (fence) {
      flushAll();
      if (inCode) {
        const language = codeLanguage ? ` class="language-${escapeAttribute(codeLanguage)}"` : "";
        html.push(`<pre><code${language}>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
        codeLanguage = "";
      } else {
        codeLanguage = fence[1];
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

    const unordered = line.match(/^[-*+]\s+(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? "ul" : "ol";
      if (listType !== nextType) {
        closeList();
        listType = nextType;
        html.push(`<${listType}>`);
      }
      let item = (unordered || ordered)[1];
      const task = item.match(/^\[([ xX])\]\s+(.+)$/);
      if (task) {
        item = `<input type="checkbox" disabled${task[1].toLocaleLowerCase() === "x" ? " checked" : ""}> ${inlineMarkdown(task[2])}`;
        html.push(`<li class="task-list-item">${item}</li>`);
      } else {
        html.push(`<li>${inlineMarkdown(item)}</li>`);
      }
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

    paragraph.push(line.trim());
  }

  flushAll();
  if (code.length) {
    context.warnings.push("存在未闭合的 Markdown 代码围栏，已按代码块渲染到文末。");
    const language = codeLanguage ? ` class="language-${escapeAttribute(codeLanguage)}"` : "";
    html.push(`<pre><code${language}>${escapeHtml(code.join("\n"))}</code></pre>`);
  }

  if (context.appendFootnotes && footnoteOrder.length) {
    const items = footnoteOrder.map((id, index) => {
      const body = extracted.footnotes.get(id);
      if (!body) context.warnings.push(`脚注 [^${id}] 没有对应定义。`);
      return `<li id="fn-${escapeAttribute(id)}">${inlineMarkdown(body || `缺少脚注定义：${id}`)} <a class="footnote-backref" href="#fnref-${escapeAttribute(id)}" aria-label="返回正文">↩</a></li>`;
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
