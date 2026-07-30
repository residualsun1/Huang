import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { hasMath, renderMarkdown } from "./markdown.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = path.join(root, "content");
const publicRoot = path.join(root, "public");
const distRoot = path.join(root, "dist");
const clientRoot = path.join(distRoot, "client");
const siteUrl = String(process.env.SITE_URL || process.env.CF_PAGES_URL || "")
  .trim()
  .replace(/\/+$/, "");
const buildCommit = String(process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || "").trim();
let stylesVersion = "development";
let sectionPetVersions = {};

const groups = [
  { key: "projects", number: "01", label: "项目", eyebrow: "PROJECT" },
  { key: "prompts", number: "02", label: "Prompt", eyebrow: "Prompt" },
  { key: "writings", number: "03", label: "写作", eyebrow: "WRITING" },
  { key: "readings", number: "04", label: "阅读", eyebrow: "READING" },
];

// 社交平台链接集中维护：将下面两个地址替换为你的个人主页即可。
const socialLinks = {
  x: "https://x.com/Residualsun1/",
  github: "https://github.com/residualsun1/",
};

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
  let activeKey = "";
  const parseValue = (rawValue) => {
    let value = rawValue.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return value;
  };

  for (const line of normalized.slice(4, end).split("\n")) {
    const arrayItem = line.match(/^\s+-\s+(.+)$/);
    if (arrayItem && activeKey) {
      if (!Array.isArray(data[activeKey])) data[activeKey] = [];
      data[activeKey].push(parseValue(arrayItem[1]));
      continue;
    }

    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const value = parseValue(line.slice(separator + 1));
    data[key] = value;
    activeKey = key;
  }
  return { data, body: normalized.slice(end + 5).trim() };
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  const source = String(value || "").trim().replace(/^\[|\]$/g, "");
  if (!source) return [];
  return source.split(",").map((item) => item.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
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

// 递归查找栏目目录中的 Markdown 文件。
// 既兼容 content/writings/article.md，也兼容 content/writings/2026/article.md。
async function findMarkdownFiles(directory, relativeDirectory = "") {
  const currentDirectory = path.join(directory, relativeDirectory);
  const directoryEntries = await readdir(currentDirectory, { withFileTypes: true });
  const files = [];

  for (const directoryEntry of directoryEntries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relativePath = path.join(relativeDirectory, directoryEntry.name);
    if (directoryEntry.isDirectory()) {
      files.push(...await findMarkdownFiles(directory, relativePath));
    } else if (directoryEntry.isFile() && directoryEntry.name.toLowerCase().endsWith(".md")) {
      files.push(relativePath);
    }
  }

  return files;
}

async function loadContent(group) {
  const directory = path.join(contentRoot, group.key);
  const files = await findMarkdownFiles(directory);
  const entries = [];
  const slugSources = new Map();

  for (const file of files) {
    const source = await readFile(path.join(directory, file), "utf8");
    const { data, body } = parseFrontmatter(source);
    const slug = String(data.slug || path.basename(file, path.extname(file))).trim();
    const displayPath = file.split(path.sep).join("/");
    if (!data.title || !data.date) {
      throw new Error(`${group.key}/${displayPath} 缺少 title 或 date`);
    }
    if (slugSources.has(slug)) {
      throw new Error(
        `${group.key} 中存在重复 slug「${slug}」：${slugSources.get(slug)} 与 ${displayPath}`,
      );
    }
    slugSources.set(slug, displayPath);
    entries.push({
      ...data,
      slug,
      author: String(data.author || "").trim(),
      tags: normalizeList(data.tags),
      homeDescription: String(data.description || "").trim(),
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

function absoluteUrl(pathname) {
  return siteUrl ? new URL(pathname, `${siteUrl}/`).href : "";
}

function layout({
  title,
  description,
  content,
  bodyClass = "",
  math = false,
  pathname = "/",
  index = true,
}) {
  const canonicalUrl = absoluteUrl(pathname);
  const socialImageUrl = absoluteUrl("/og.png");
  const canonicalAssets = canonicalUrl ? `
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:image" content="${escapeHtml(socialImageUrl)}">
  <meta name="twitter:image" content="${escapeHtml(socialImageUrl)}">` : "";
  const mathAssets = math ? `
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.18.1/dist/katex.min.css" integrity="sha384-1vdNCNel6Tx/NQa8IR1mGOGKsbGreCkOPfbtPPnUURJ5Tu2PRVfQ/7KLZC+Pi1p1" crossorigin="anonymous">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.18.1/dist/katex.min.js" integrity="sha384-ycJ6GAwiS15LoUPipwJOrWTvkUHl/YqELValBwI5I4awP1EeEQJYarj+w85ntcz7" crossorigin="anonymous"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.18.1/dist/contrib/auto-render.min.js" integrity="sha384-bjyGPfbij8/NDKJhSGZNP/khQVgtHUE5exjm4Ydllo42FwIgYsdLO2lXGmRBf5Mz" crossorigin="anonymous"></script>
  <script defer src="/math.js"></script>` : "";
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#f2ede3">
  <meta name="robots" content="${index ? "index, follow" : "noindex, follow"}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta name="twitter:card" content="summary_large_image">
  ${canonicalAssets}
  <link rel="icon" href="/favicon.svg?v=${stylesVersion}" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Homemade+Apple&amp;family=Libre+Baskerville:wght@400;700&amp;family=Noto+Serif+SC:wght@400;500;600;700&amp;display=swap">
  <link rel="stylesheet" href="/styles.css?v=${stylesVersion}">${mathAssets}
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
        <span class="brand-mark" aria-hidden="true">Huang</span>
      </a>
    </div>
  </header>`;
}

function siteFooter() {
  return `<footer class="site-footer">
    <div class="site-footer-inner">
      <a class="footer-email" href="mailto:Residualsun@proton.me" aria-label="发送邮件至 Residualsun@proton.me">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect>
          <path d="m3 7 9 6 9-6"></path>
        </svg>
        <span>Residualsun@proton.me</span>
      </a>
      <span class="footer-meta">© 2026 Huang</span>
    </div>
  </footer>`;
}

function socialNavigation() {
  return `<nav class="social-links" aria-label="社交平台">
    <a href="${socialLinks.github}" target="_blank" rel="noreferrer" aria-label="GitHub 个人主页">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.014-1.699-2.782.604-3.369-1.341-3.369-1.341-.455-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.004.071 1.532 1.031 1.532 1.031.892 1.529 2.341 1.087 2.91.831.091-.646.349-1.087.635-1.337-2.221-.253-4.555-1.111-4.555-4.943 0-1.092.39-1.984 1.03-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.845a9.56 9.56 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.591 1.028 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.679.92.679 1.855 0 1.338-.012 2.419-.012 2.748 0 .268.18.579.688.481A10.003 10.003 0 0 0 22 12c0-5.523-4.477-10-10-10z"></path></svg>
      <span>Guozheng Huang</span>
    </a>
    <span class="social-separator" aria-hidden="true">·</span>
    <a href="${socialLinks.x}" target="_blank" rel="noreferrer" aria-label="X 个人主页">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
      <span>Residualsun</span>
    </a>
  </nav>`;
}

const projectIcons = {
  github: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.014-1.699-2.782.604-3.369-1.341-3.369-1.341-.455-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.004.071 1.532 1.031 1.532 1.031.892 1.529 2.341 1.087 2.91.831.091-.646.349-1.087.635-1.337-2.221-.253-4.555-1.111-4.555-4.943 0-1.092.39-1.984 1.03-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.845a9.56 9.56 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.591 1.028 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.679.92.679 1.855 0 1.338-.012 2.419-.012 2.748 0 .268.18.579.688.481A10.003 10.003 0 0 0 22 12c0-5.523-4.477-10-10-10z"></path></svg>`,
  // Link 图标取自 SVG Repo 的 CC0 资源：https://www.svgrepo.com/svg/525988/link
  link: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.7285 3.88396C17.1629 2.44407 19.2609 2.41383 20.4224 3.57981C21.586 4.74798 21.5547 6.85922 20.1194 8.30009L17.6956 10.7333C17.4033 11.0268 17.4042 11.5017 17.6976 11.794C17.9911 12.0863 18.466 12.0854 18.7583 11.7919L21.1821 9.35869C23.0934 7.43998 23.3334 4.37665 21.4851 2.5212C19.6346 0.663551 16.5781 0.905664 14.6658 2.82536L9.81817 7.69182C7.90688 9.61053 7.66692 12.6739 9.51519 14.5293C9.80751 14.8228 10.2824 14.8237 10.5758 14.5314C10.8693 14.2391 10.8702 13.7642 10.5779 13.4707C9.41425 12.3026 9.44559 10.1913 10.8809 8.75042L15.7285 3.88396Z"></path><path d="M14.4851 9.47074C14.1928 9.17728 13.7179 9.17636 13.4244 9.46868C13.131 9.76101 13.1301 10.2359 13.4224 10.5293C14.586 11.6975 14.5547 13.8087 13.1194 15.2496L8.27178 20.1161C6.83745 21.556 4.73937 21.5863 3.57791 20.4203C2.41424 19.2521 2.44559 17.1408 3.88089 15.6999L6.30473 13.2667C6.59706 12.9732 6.59614 12.4984 6.30268 12.206C6.00922 11.9137 5.53434 11.9146 5.24202 12.2081L2.81818 14.6413C0.906876 16.5601 0.666916 19.6234 2.51519 21.4789C4.36567 23.3365 7.42221 23.0944 9.33449 21.1747L14.1821 16.3082C16.0934 14.3895 16.3334 11.3262 14.4851 9.47074Z"></path></svg>`,
};

function projectAction({ href, label, icon, field }) {
  const content = `${icon}<span>${label}</span>`;
  if (!String(href || "").trim()) {
    return `<span class="project-action is-disabled" aria-disabled="true" title="在项目 Markdown 中填写 ${field}">${content}</span>`;
  }
  return `<a class="project-action" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${content}</a>`;
}

function listRow(entry, { summary = entry.description } = {}) {
  return `<a class="writing-row" href="${entry.href}">
    <time datetime="${escapeHtml(entry.date)}">${formatDate(entry.date)}</time>
    <span class="writing-copy">
      <strong>${escapeHtml(entry.title)}</strong>
      ${summary ? `<span>${escapeHtml(summary)}</span>` : ""}
    </span>
    <span class="row-arrow" aria-hidden="true">→</span>
  </a>`;
}

export function projectCard(entry) {
  const icon = String(entry.icon || "").trim();
  const iconClass = String(entry.slug || "project").replace(/[^a-z0-9_-]/gi, "-");
  const iconContent = icon
    ? `<img src="${escapeHtml(icon)}" alt="" width="192" height="192" loading="lazy" decoding="async">`
    : `<span class="project-icon-fallback" aria-hidden="true">${escapeHtml(String(entry.title || "?").trim().slice(0, 1))}</span>`;

  return `
    <article class="project-row">
      <a class="project-row-main" href="${entry.href}" aria-label="查看项目：${escapeHtml(entry.title)}">
        <span class="project-icon project-icon--${escapeHtml(iconClass)}">${iconContent}</span>
        <span class="project-row-copy">
          <h3>${escapeHtml(entry.title)}</h3>
          <span class="project-description">${escapeHtml(entry.description)}</span>
        </span>
      </a>
      <div class="project-row-actions" aria-label="${escapeHtml(entry.title)}的外部链接">
        ${projectAction({ href: entry.repository, label: "项目仓库", icon: projectIcons.github, field: "repository" })}
        ${projectAction({ href: entry.website, label: "项目地址", icon: projectIcons.link, field: "website" })}
      </div>
    </article>`;
}

const sectionPetAssets = {
  projects: { name: "typing", width: 115, height: 157 },
  prompts: { name: "thinking", width: 127, height: 142 },
  writings: { name: "notification", width: 147, height: 157 },
  readings: { name: "idle", width: 127, height: 142 },
};

function sectionPet(key) {
  const asset = sectionPetAssets[key];
  const source = `/images/clawd/clawd-${asset.name}`;
  const version = sectionPetVersions[asset.name] || "development";

  return `<picture class="section-pet" aria-hidden="true">
      <source media="(prefers-reduced-motion: reduce)" srcset="${source}-still.png?v=${version}">
      <img src="${source}.gif?v=${version}" alt="" width="${asset.width}" height="${asset.height}" decoding="async">
    </picture>`;
}

function homePage(collections) {
  const byKey = Object.fromEntries(collections.map((collection) => [collection.group.key, collection]));
  const projects = byKey.projects.entries.slice(0, 3).map(projectCard).join("");
  const prompts = byKey.prompts.entries.slice(0, 3).map((entry) => listRow(entry, { summary: entry.homeDescription })).join("");
  const writings = byKey.writings.entries.slice(0, 3).map((entry) => listRow(entry, { summary: entry.homeDescription })).join("");
  const readings = byKey.readings.entries.slice(0, 3).map((entry) => listRow(entry, { summary: entry.homeDescription })).join("");

  const vinylPlayer = `<div class="vinyl-player" data-vinyl-player>
    <button
      class="vinyl-player__button"
      type="button"
      aria-label="播放背景音乐"
      aria-describedby="vinyl-player-note vinyl-player-status"
      aria-pressed="false"
      data-playing="false"
    >
      <span class="vinyl-player__viewport" aria-hidden="true">
        <span class="vinyl-player__disc">
          <span class="vinyl-player__surface">
            <span class="vinyl-player__label">
              <span class="vinyl-player__spindle"></span>
            </span>
          </span>
        </span>
      </span>
    </button>
    <span class="vinyl-player__note" id="vinyl-player-note">
      <span class="vinyl-player__note-text">来首 Huang，看看文章</span>
      <svg class="vinyl-player__leader" viewBox="0 0 36 34" aria-hidden="true">
        <path d="M3 5c11 1 22 8 28 23"></path>
      </svg>
    </span>
    <audio data-vinyl-audio data-src="/audio/site-theme.mp3" preload="none"></audio>
    <span class="vinyl-player__status sr-only" id="vinyl-player-status" aria-live="polite"></span>
  </div>`;

  const sectionHeader = (group) => `<header class="section-heading">
    <p class="section-kicker" id="${group.key}-title">
      <span class="section-kicker__label">${group.number} / ${group.label}</span>
      <span class="section-kicker__rail" aria-hidden="true">${group.key === "projects" ? "" : sectionPet(group.key)}</span>
    </p>
    ${group.key === "projects" ? vinylPlayer : ""}
  </header>`;

  return layout({
    title: "Huang",
    description: "你好，我是 Huang。我在探索 AI、人文、艺术，希望能做出一些有个人品味的产品。",
    pathname: "/",
    bodyClass: "home",
    content: `${siteHeader()}
    <main class="site-shell home-layout">
      <section class="hero" aria-labelledby="home-title">
        <h1 id="home-title" class="sr-only">Huang 的 AI 学习记录</h1>
        <div class="hero-copy">
          <div class="hero-intro">
            <p>你好，我是 Huang。</p>
            <p>我在探索 AI 与人文结合的可能性，希望能做出一些有意思的产品。</p>
            <p>目前，本站主要包括「项目」、「Prompt」、「写作」和「阅读」四个版块。</p>
          </div>
          ${socialNavigation()}
        </div>
      </section>

      <section class="content-section" id="projects" aria-labelledby="projects-title">
        ${sectionHeader(byKey.projects.group)}
        <div class="project-list">${projects}</div>
        <div class="section-more"><a href="/projects/">所有项目<span aria-hidden="true">→</span></a></div>
      </section>

      <section class="content-section" id="prompts" aria-labelledby="prompts-title">
        ${sectionHeader(byKey.prompts.group)}
        <div class="writing-list">${prompts}</div>
        <div class="section-more"><a href="/prompts/">所有文章<span aria-hidden="true">→</span></a></div>
      </section>

      <section class="content-section" id="writings" aria-labelledby="writings-title">
        ${sectionHeader(byKey.writings.group)}
        <div class="writing-list">${writings}</div>
        <div class="section-more"><a href="/writings/">所有文章<span aria-hidden="true">→</span></a></div>
      </section>

      <section class="content-section" id="readings" aria-labelledby="readings-title">
        ${sectionHeader(byKey.readings.group)}
        <div class="writing-list">${readings}</div>
        <div class="section-more"><a href="/readings/">所有文章<span aria-hidden="true">→</span></a></div>
      </section>
    </main>
    ${siteFooter()}
    <script defer src="/music-player.js"></script>`,
  });
}

function collectionPage(collection) {
  const { group, entries } = collection;
  const archive = group.key === "projects"
    ? `<div class="project-list">${entries.map(projectCard).join("")}</div>`
    : `<div class="writing-list">${entries.map((entry) => listRow(entry, { summary: "" })).join("")}</div>`;

  return layout({
    title: `${group.label} — Huang`,
    description: `Huang 的${group.label}归档。`,
    pathname: `/${group.key}/`,
    bodyClass: `listing listing-${group.key}`,
    content: `${siteHeader()}
    <main class="collection-shell">
      <header class="collection-header">
        <p class="section-kicker">${group.number} / ${group.eyebrow}</p>
        <h1>${group.label}</h1>
      </header>
      ${archive}
      <a class="collection-back" href="/#${group.key}">← 返回首页</a>
    </main>
    ${siteFooter()}`,
  });
}

function createTableOfContents(html) {
  const headings = [...html.matchAll(/<h([2-4]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)].map((match) => ({
    level: Number(match[1]),
    id: match[2],
    label: match[3].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&"),
  }));
  if (headings.length < 2) return "";

  return `<aside class="article-toc" aria-label="文章目录" tabindex="0">
    <p>本文目录</p>
    <ol>${headings.map((heading) => `<li class="toc-level-${heading.level}"><a href="#${heading.id}">${heading.label}</a></li>`).join("")}</ol>
  </aside>`;
}

export function articlePagination(previousEntry, nextEntry) {
  const item = (entry, direction) => {
    const isPrevious = direction === "previous";
    const label = isPrevious ? "← 上一篇文章" : "下一篇文章 →";
    if (!entry) {
      return `<span class="article-pagination-item is-disabled ${direction}">
        <span>${label}</span>
        <strong>暂无${isPrevious ? "上一篇" : "下一篇"}</strong>
      </span>`;
    }
    return `<a class="article-pagination-item ${direction}" href="${entry.href}" aria-label="${label}：${escapeHtml(entry.title)}">
      <span>${label}</span>
      <strong>${escapeHtml(entry.title)}</strong>
    </a>`;
  };

  return `<nav class="article-pagination" aria-label="上一篇与下一篇文章">
    ${item(previousEntry, "previous")}
    ${item(nextEntry, "next")}
  </nav>`;
}

export function detailPage(entry, previousEntry, nextEntry) {
  const warnings = [];
  const rendered = renderMarkdown(entry.body, { warnings });
  for (const warning of warnings) {
    console.warn(`[${entry.group.key}/${entry.slug}] ${warning}`);
  }
  const toc = createTableOfContents(rendered.html);
  const author = entry.author ? `<span class="article-author">${escapeHtml(entry.author)}</span>` : "";
  const tags = entry.tags.length ? `<ul class="article-tags" aria-label="文章标签">${entry.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>` : "";
  const pagination = articlePagination(previousEntry, nextEntry);
  return layout({
    title: `${entry.title} — Huang`,
    description: entry.description,
    pathname: entry.href,
    bodyClass: `detail detail-${entry.group.key} detail-editorial`,
    math: hasMath(entry.body),
    content: `${siteHeader()}
    <main class="article-shell">
      <nav class="breadcrumb" aria-label="面包屑">
        <a href="/">首页</a><span aria-hidden="true">/</span><a href="/${entry.group.key}/">${entry.group.label}</a>
      </nav>
      <header class="article-header">
        <h1>${escapeHtml(entry.title)}</h1>
        <div class="article-meta">
          <div class="article-byline">${author}<time datetime="${escapeHtml(entry.date)}">发布于 ${formatDate(entry.date)}</time></div>
          ${tags}
        </div>
      </header>
      <div class="article-layout">
        <div class="article-main">
          <article class="prose">${rendered.html}</article>
          ${pagination}
          <footer class="article-footer"><a href="/">← 回到首页</a></footer>
        </div>
        ${toc}
      </div>
    </main>
    ${siteFooter()}
    <script defer src="/code-blocks.js"></script>
    <script defer src="/toc.js"></script>`,
  });
}

function notFoundPage() {
  return layout({
    title: "页面不存在 — Huang",
    description: "你访问的页面不存在。",
    pathname: "/404.html",
    index: false,
    content: `${siteHeader()}
    <main class="collection-shell">
      <header class="collection-header">
        <p class="section-kicker">404 / NOT FOUND</p>
        <h1>页面不存在</h1>
      </header>
      <p>这个链接可能已经失效，或者页面地址有误。</p>
      <a class="collection-back" href="/">← 返回首页</a>
    </main>
    ${siteFooter()}`,
  });
}

async function writeDiscoveryFiles(collections) {
  await writeFile(
    path.join(clientRoot, "robots.txt"),
    `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${absoluteUrl("/sitemap.xml")}\n` : ""}`,
    "utf8",
  );

  if (!siteUrl) return;

  const paths = [
    "/",
    ...collections.flatMap(({ group, entries }) => [
      `/${group.key}/`,
      ...entries.map((entry) => entry.href),
    ]),
  ];
  const urls = paths
    .map((pathname) => `  <url><loc>${escapeHtml(absoluteUrl(pathname))}</loc></url>`)
    .join("\n");
  await writeFile(
    path.join(clientRoot, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    "utf8",
  );
}

export async function buildSite() {
  await rm(distRoot, { recursive: true, force: true });
  await mkdir(clientRoot, { recursive: true });
  await cp(publicRoot, clientRoot, { recursive: true });
  const styles = await readFile(path.join(publicRoot, "styles.css"));
  stylesVersion = createHash("sha256").update(styles).digest("hex").slice(0, 12);
  sectionPetVersions = {};
  for (const name of new Set(Object.values(sectionPetAssets).map((asset) => asset.name))) {
    const still = await readFile(path.join(publicRoot, "images", "clawd", `clawd-${name}-still.png`));
    const animation = await readFile(path.join(publicRoot, "images", "clawd", `clawd-${name}.gif`));
    sectionPetVersions[name] = createHash("sha256")
      .update(still)
      .update(animation)
      .digest("hex")
      .slice(0, 12);
  }

  const collections = [];
  for (const group of groups) {
    const entries = await loadContent(group);
    collections.push({ group, entries });
    for (const [index, entry] of entries.entries()) {
      const target = path.join(clientRoot, group.key, entry.slug);
      await mkdir(target, { recursive: true });
      const previousEntry = entries[index + 1];
      const nextEntry = entries[index - 1];
      await writeFile(path.join(target, "index.html"), detailPage(entry, previousEntry, nextEntry), "utf8");
    }
  }

  await writeFile(path.join(clientRoot, "index.html"), homePage(collections), "utf8");
  await writeFile(path.join(clientRoot, "404.html"), notFoundPage(), "utf8");
  for (const collection of collections) {
    const target = path.join(clientRoot, collection.group.key);
    await mkdir(target, { recursive: true });
    await writeFile(path.join(target, "index.html"), collectionPage(collection), "utf8");
  }
  await writeDiscoveryFiles(collections);
  await writeFile(
    path.join(clientRoot, "version.json"),
    `${JSON.stringify({
      commit: buildCommit || "local",
      shortCommit: buildCommit ? buildCommit.slice(0, 7) : "local",
      branch: String(process.env.CF_PAGES_BRANCH || "").trim() || "local",
      assetVersion: stylesVersion,
    }, null, 2)}\n`,
    "utf8",
  );
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
