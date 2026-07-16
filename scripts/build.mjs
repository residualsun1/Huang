import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { hasMath, renderMarkdown } from "./markdown.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = path.join(root, "content");
const publicRoot = path.join(root, "public");
const distRoot = path.join(root, "dist");
const clientRoot = path.join(distRoot, "client");

const groups = [
  { key: "projects", number: "01", label: "项目", eyebrow: "PROJECT" },
  { key: "writings", number: "02", label: "写作", eyebrow: "WRITING" },
  { key: "prompts", number: "03", label: "提示词", eyebrow: "PROMPT" },
];

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function parseFrontmatter(source) {
  const normalized = source.replaceAll("\r\n", "\n");
  if (!normalized.startsWith("---\n")) return { data: {}, body: normalized };
  const end = normalized.indexOf("\n---\n", 4);
  if (end < 0) return { data: {}, body: normalized };

  const data = {};
  for (const line of normalized.slice(4, end).split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, body: normalized.slice(end + 5).trim() };
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function markdownToHtml(markdown) {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const html = [];
  let paragraph = [];
  let listType = null;
  let inCode = false;
  let code = [];

  const flushParagraph = () => {
    if (paragraph.length) html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (listType) html.push(`</${listType}>`);
    listType = null;
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      flushParagraph();
      closeList();
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? "ul" : "ol";
      if (listType !== nextType) {
        closeList();
        listType = nextType;
        html.push(`<${listType}>`);
      }
      html.push(`<li>${inlineMarkdown((unordered || ordered)[1])}</li>`);
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      closeList();
      html.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  if (code.length) html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  return html.join("\n");
}

function deriveDescription(markdown) {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/\{\{[<%][\s\S]*?[>%]\}\}/g, " ")
    .replace(/^\[\^[^\]]+\]:.*$/gm, " ")
    .replace(/\[\^[^\]]+\]/g, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*>\d.]+\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plainText) return "阅读全文。";
  return plainText.length > 92 ? `${plainText.slice(0, 92)}…` : plainText;
}

async function loadContent(group) {
  const directory = path.join(contentRoot, group.key);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".md"));
  const entries = [];

  for (const file of files) {
    const source = await readFile(path.join(directory, file), "utf8");
    const { data, body } = parseFrontmatter(source);
    const slug = data.slug || file.replace(/\.md$/, "");
    if (!data.title || !data.date) {
      throw new Error(`${group.key}/${file} 缺少 title 或 date`);
    }
    entries.push({
      ...data,
      slug,
      description: data.description || deriveDescription(body),
      body: body.replace(/<!--([\s\S]*?)-->/g, "").trim(),
      href: `/${group.key}/${slug}/`,
      group,
    });
  }

  return entries.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function formatDate(value) {
  const [year, month, day] = String(value).split("-");
  return [year, month, day].filter(Boolean).join(".");
}

function layout({ title, description, content, bodyClass = "", math = false }) {
  const mathAssets = math ? `
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css" crossorigin="anonymous">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js" crossorigin="anonymous"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>
  <script defer src="/math.js"></script>` : "";
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#f3f1ed">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="https://huang-ai-learning-notes.residualsun924088.chatgpt.site/og.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://huang-ai-learning-notes.residualsun924088.chatgpt.site/og.png">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css">${mathAssets}
</head>
<body class="${escapeHtml(bodyClass)}">
${content}
</body>
</html>`;
}

function siteHeader() {
  return `<header class="site-header">
    <div class="site-header-inner">
      <a class="site-brand" href="/" aria-label="首页">
        <span class="brand-mark" aria-hidden="true">H</span>
      </a>
      <nav class="site-nav" aria-label="主要导航">
        <a href="/#projects">项目</a>
        <a href="/#writings">写作</a>
        <a href="/#prompts">提示词</a>
      </nav>
    </div>
  </header>`;
}

function siteFooter() {
  return `<footer class="site-footer">
    <div class="site-footer-inner">
      <span>持续学习，持续修订。</span>
      <span class="footer-meta">© 2026 Huang</span>
    </div>
  </footer>`;
}

function homePage(collections) {
  const byKey = Object.fromEntries(collections.map((collection) => [collection.group.key, collection]));
  const projects = byKey.projects.entries.map((entry) => `
    <a class="project-card" href="${entry.href}">
      <div class="project-card-top">
        <span class="status-label"><span class="status-dot" aria-hidden="true"></span>持续迭代</span>
        <span class="card-arrow" aria-hidden="true">↗</span>
      </div>
      <div>
        <h3>${escapeHtml(entry.title)}</h3>
        <p>${escapeHtml(entry.description)}</p>
      </div>
      <time datetime="${escapeHtml(entry.date)}">更新于 ${formatDate(entry.date)}</time>
    </a>`).join("");
  const writings = byKey.writings.entries.map((entry) => `
    <a class="writing-row" href="${entry.href}">
      <time datetime="${escapeHtml(entry.date)}">${formatDate(entry.date)}</time>
      <span class="writing-copy">
        <strong>${escapeHtml(entry.title)}</strong>
        <span>${escapeHtml(entry.description)}</span>
      </span>
      <span class="row-arrow" aria-hidden="true">→</span>
    </a>`).join("");
  const prompts = byKey.prompts.entries.map((entry) => `
    <a class="prompt-card" href="${entry.href}">
      <span class="component-label">PROMPT</span>
      <h3>${escapeHtml(entry.title)}</h3>
      <p>${escapeHtml(entry.description)}</p>
      <span class="prompt-link">查看提示词 <span aria-hidden="true">→</span></span>
    </a>`).join("");

  const sectionHeader = (group) => `<header class="section-heading">
    <div>
      <p class="section-kicker">${group.number} / ${group.eyebrow}</p>
      <h2 id="${group.key}-title">${group.label}</h2>
    </div>
  </header>`;

  return layout({
    title: "AI 学习与理解",
    description: "记录我正在构建的项目、持续形成的理解，以及反复使用的提示词。",
    bodyClass: "home",
    content: `${siteHeader()}
    <main class="site-shell">
      <section class="hero" aria-labelledby="home-title">
        <div class="hero-copy">
          <h1 id="home-title" class="sr-only">Huang 的 AI 学习记录</h1>
          <blockquote class="hero-dialogue">
            <p>Who is out there？</p>
            <p>Em…are you curious about how large language model works?</p>
            <p>Let me think…can I be half-consciousness?</p>
          </blockquote>
        </div>
        <figure class="hero-scene">
          <button class="scene-frame" type="button" aria-label="唤醒像素世界与 AI 伙伴">
            <img class="scene-background" src="/images/ai-companion-scene-v2.png" alt="粗像素艺术场景：一名男性站在夜晚发光的树下" width="1254" height="1254" fetchpriority="high">
            <canvas class="scene-particles" aria-hidden="true"></canvas>
            <span class="codex-pet" aria-hidden="true">
              <span class="pet-shadow"></span>
              <span class="pet-shell">
                <span class="pet-ear pet-ear-left"></span>
                <span class="pet-ear pet-ear-right"></span>
                <span class="pet-screen"><i></i><b></b></span>
                <span class="pet-foot pet-foot-left"></span>
                <span class="pet-foot pet-foot-right"></span>
              </span>
            </span>
            <span class="scene-feather" aria-hidden="true"></span>
            <span class="sr-only">点击后场景会震动、粒子飞舞，AI 伙伴也会移动。</span>
          </button>
        </figure>
      </section>

      <section class="content-section" id="projects" aria-labelledby="projects-title">
        ${sectionHeader(byKey.projects.group)}
        <div class="project-grid">${projects}</div>
      </section>

      <section class="content-section" id="writings" aria-labelledby="writings-title">
        ${sectionHeader(byKey.writings.group)}
        <div class="writing-list">${writings}</div>
      </section>

      <section class="content-section" id="prompts" aria-labelledby="prompts-title">
        ${sectionHeader(byKey.prompts.group)}
        <div class="prompt-grid">${prompts}</div>
      </section>
    </main>
    ${siteFooter()}
    <script defer src="/scene.js"></script>`,
  });
}

function createTableOfContents(html) {
  const headings = [...html.matchAll(/<h([2-4]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)].map((match) => ({
    level: Number(match[1]),
    id: match[2],
    label: match[3].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&"),
  }));
  if (headings.length < 2) return "";

  return `<aside class="article-toc" aria-label="文章目录">
    <p>本文目录</p>
    <ol>${headings.map((heading) => `<li class="toc-level-${heading.level}"><a href="#${heading.id}">${heading.label}</a></li>`).join("")}</ol>
  </aside>`;
}

function detailPage(entry) {
  const warnings = [];
  const rendered = renderMarkdown(entry.body, { warnings });
  for (const warning of warnings) {
    console.warn(`[${entry.group.key}/${entry.slug}] ${warning}`);
  }
  const toc = createTableOfContents(rendered.html);
  return layout({
    title: `${entry.title} — AI 学习与理解`,
    description: entry.description,
    bodyClass: "detail",
    math: hasMath(entry.body),
    content: `${siteHeader()}
    <main class="article-shell">
      <nav class="breadcrumb" aria-label="面包屑">
        <a href="/">首页</a><span aria-hidden="true">/</span><a href="/#${entry.group.key}">${entry.group.label}</a>
      </nav>
      <header class="article-header">
        <p class="eyebrow">${entry.group.number} / ${entry.group.eyebrow}</p>
        <h1>${escapeHtml(entry.title)}</h1>
        <p class="article-description">${escapeHtml(entry.description)}</p>
        <div class="article-meta">
          <time datetime="${escapeHtml(entry.date)}">发布于 ${formatDate(entry.date)}</time>
          <span>${entry.group.label}</span>
        </div>
      </header>
      <div class="article-layout">
        <article class="prose">${rendered.html}</article>
        ${toc}
      </div>
      <footer class="article-footer"><a href="/#${entry.group.key}">← 回到${entry.group.label}</a></footer>
    </main>
    ${siteFooter()}`,
  });
}

export async function buildSite() {
  await rm(distRoot, { recursive: true, force: true });
  await mkdir(clientRoot, { recursive: true });
  await cp(publicRoot, clientRoot, { recursive: true });

  const collections = [];
  for (const group of groups) {
    const entries = await loadContent(group);
    collections.push({ group, entries });
    for (const entry of entries) {
      const target = path.join(clientRoot, group.key, entry.slug);
      await mkdir(target, { recursive: true });
      await writeFile(path.join(target, "index.html"), detailPage(entry), "utf8");
    }
  }

  await writeFile(path.join(clientRoot, "index.html"), homePage(collections), "utf8");
  await mkdir(path.join(distRoot, "server"), { recursive: true });
  await writeFile(
    path.join(distRoot, "server", "index.js"),
    'export default { async fetch(request, env) { return env.ASSETS.fetch(request); } };\n',
    "utf8",
  );
  await mkdir(path.join(distRoot, ".openai"), { recursive: true });
  await cp(path.join(root, ".openai", "hosting.json"), path.join(distRoot, ".openai", "hosting.json"));

  const total = collections.reduce((sum, collection) => sum + collection.entries.length, 0);
  console.log(`已生成 ${total} 篇内容到 dist/client`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await buildSite();
}
