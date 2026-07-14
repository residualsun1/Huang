import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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

async function loadContent(group) {
  const directory = path.join(contentRoot, group.key);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".md"));
  const entries = [];

  for (const file of files) {
    const source = await readFile(path.join(directory, file), "utf8");
    const { data, body } = parseFrontmatter(source);
    const slug = file.replace(/\.md$/, "");
    if (!data.title || !data.description || !data.date) {
      throw new Error(`${group.key}/${file} 缺少 title、description 或 date`);
    }
    entries.push({
      ...data,
      slug,
      body,
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

function layout({ title, description, content, bodyClass = "" }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css">
</head>
<body class="${escapeHtml(bodyClass)}">
${content}
</body>
</html>`;
}

function homePage(collections) {
  const sections = collections.map(({ group, entries }) => `
    <section class="content-section" aria-labelledby="${group.key}-title">
      <div class="section-heading">
        <h2 id="${group.key}-title"><span>${group.number}</span> ${group.label}</h2>
        <div class="section-rule" aria-hidden="true"></div>
      </div>
      <div class="entry-list">
        ${entries.map((entry) => `
          <article class="entry-item">
            <a href="${entry.href}">${escapeHtml(entry.title)}</a>
            <p>${escapeHtml(entry.description)}</p>
          </article>`).join("")}
      </div>
    </section>`).join("");

  return layout({
    title: "AI 学习与理解",
    description: "记录我正在构建的项目、持续形成的理解，以及反复使用的提示词。",
    bodyClass: "home",
    content: `<main class="site-shell">
      <div class="update-pill"><span>2026.07.14</span> 基础内容架构 Demo</div>
      <header class="hero">
        <p class="eyebrow">PERSONAL AI NOTEBOOK</p>
        <h1>AI 学习与理解</h1>
        <p class="intro">记录我正在构建的项目、持续形成的理解，以及反复使用的提示词。这里不是答案库，而是一份不断修订的个人认知档案。</p>
      </header>
      <div class="quiet-space" aria-hidden="true"><span>现在，先从清楚地写下一件事开始。</span></div>
      ${sections}
      <footer><span>持续学习，持续修订。</span><span>© 2026</span></footer>
    </main>`,
  });
}

function detailPage(entry) {
  return layout({
    title: `${entry.title} — AI 学习与理解`,
    description: entry.description,
    bodyClass: "detail",
    content: `<main class="article-shell">
      <nav class="article-nav"><a href="/">← 返回首页</a><span>${entry.group.eyebrow}</span></nav>
      <header class="article-header">
        <p class="eyebrow">${entry.group.eyebrow}</p>
        <h1>${escapeHtml(entry.title)}</h1>
        <p class="article-description">${escapeHtml(entry.description)}</p>
        <time datetime="${escapeHtml(entry.date)}">${formatDate(entry.date)}</time>
      </header>
      <article class="prose">${markdownToHtml(entry.body)}</article>
      <footer class="article-footer"><a href="/">回到全部内容 →</a></footer>
    </main>`,
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
