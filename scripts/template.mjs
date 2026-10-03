// Huang's reader content and interactions, with the shared Residualsun brand shell.
import { escapeHtml } from "./frontmatter.mjs";
import { assetUrl } from "./assets.mjs";
import { hasAudio, hasMath, hasMetingAudio, renderMarkdown } from "./markdown.mjs";
const siteUrl = String(process.env.SITE_URL || process.env.CF_PAGES_URL || "https://guozheng.dev").trim().replace(/\/+$/, "");

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
  audio = false,
  metingAudio = false,
  math = false,
  pathname = "/",
  index = true,
}) {
  const canonicalUrl = absoluteUrl(pathname);
  const socialImageUrl = absoluteUrl("/images/avatar.jpg");
  const canonicalAssets = canonicalUrl ? `
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:image" content="${escapeHtml(socialImageUrl)}">
  <meta name="twitter:image" content="${escapeHtml(socialImageUrl)}">` : "";
  const mathAssets = math ? `
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.18.1/dist/katex.min.css" integrity="sha384-1vdNCNel6Tx/NQa8IR1mGOGKsbGreCkOPfbtPPnUURJ5Tu2PRVfQ/7KLZC+Pi1p1" crossorigin="anonymous">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.18.1/dist/katex.min.js" integrity="sha384-ycJ6GAwiS15LoUPipwJOrWTvkUHl/YqELValBwI5I4awP1EeEQJYarj+w85ntcz7" crossorigin="anonymous"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.18.1/dist/contrib/auto-render.min.js" integrity="sha384-bjyGPfbij8/NDKJhSGZNP/khQVgtHUE5exjm4Ydllo42FwIgYsdLO2lXGmRBf5Mz" crossorigin="anonymous"></script>
  <script defer src="${assetUrl("/math.js")}"></script>` : "";
  const audioStyles = audio ? `
  <link rel="stylesheet" href="/vendor/aplayer/1.10.1/APlayer.min.css">` : "";
  const audioScripts = audio ? `
  <script defer src="/vendor/aplayer/1.10.1/APlayer.min.js"></script>
  ${metingAudio ? '<script defer src="/vendor/meting/2.0.2/Meting.min.js"></script>' : ""}
  <script defer src="${assetUrl("/audio-player.js")}"></script>` : "";
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#ffffff">
  <meta name="robots" content="${index ? "index, follow" : "noindex, follow"}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta name="twitter:card" content="summary_large_image">
  ${canonicalAssets}
  <link rel="icon" href="${assetUrl("/favicon.png")}" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="preload" href="/fonts/libre-baskerville-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${assetUrl("/fonts.css")}">
  <link rel="stylesheet" href="${assetUrl("/styles.css")}">
  <link rel="stylesheet" href="${assetUrl("/site-chrome.css")}">
  <link rel="stylesheet" href="${assetUrl("/reader.css")}">${mathAssets}${audioStyles}
</head>
<body class="${escapeHtml(bodyClass)}">
${content}${audioScripts}
</body>
</html>`;
}

function siteHeader(active = "") {
  const navItem = (label, href, key) => `<a${active === key ? ' class="is-active" aria-current="page"' : ""} href="${href}">${label}</a>`;
  return `<header class="rs-header" id="home">
    <div class="rs-masthead">
      <p class="rs-brand"><a href="/" aria-label="Residualsun 首页">Residualsun</a></p>
    </div>
    <nav class="rs-nav" aria-label="主导航">
      ${navItem("首页", "/", "home")}
      ${navItem("写作", "/#writings", "writings")}
      ${navItem("项目", "/#projects", "projects")}
      ${navItem("阅读", "/#readings", "readings")}
      <a href="/#archive">归档</a><a href="/#about">关于</a>
    </nav>
  </header>`;
}

function siteFooter() {
  return `<div class="rs-footer-width"><footer class="rs-footer">
    <div class="rs-footer-title">Residualsun</div>
    <nav aria-label="页脚导航">
      <a href="/#about">关于</a><a href="/#archive">归档</a>
      <a href="https://github.com/residualsun1" target="_blank" rel="noreferrer">GitHub</a>
    </nav>
  </footer></div><div class="rs-copyright">© 2026 Residualsun</div>`;
}

export function listRow(entry, { summary = entry.description, showPinned = false } = {}) {
  const isPinned = showPinned && entry.pinned;
  const titlePinBadge = isPinned ? `<span class="pin-badge pin-badge--writing-title">置顶</span>` : "";
  const metaPinBadge = isPinned ? `<span class="pin-badge pin-badge--writing-meta">置顶</span>` : "";
  return `<a class="writing-row${isPinned ? " is-pinned" : ""}" href="${entry.href}">
    <span class="writing-meta">
      <time datetime="${escapeHtml(entry.date)}">${formatDate(entry.date)}</time>
      ${metaPinBadge}
    </span>
    <span class="writing-copy">
      <strong><span class="writing-title-text">${escapeHtml(entry.title)}</span>${titlePinBadge}</strong>
      ${summary ? `<span>${escapeHtml(summary)}</span>` : ""}
    </span>
    <span class="row-arrow" aria-hidden="true">→</span>
  </a>`;
}

function collectionPage(collection) {
  const { group, entries } = collection;
  const archive = `<div class="writing-list">${entries.map((entry) => listRow(entry, { summary: "" })).join("")}</div>`;

  return layout({
    title: `${group.label} — Residualsun`,
    description: `Residualsun 的${group.label}归档。`,
    pathname: `/${group.key}/`,
    bodyClass: `listing listing-${group.key}`,
    content: `${siteHeader(group.key)}
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
  const author = `<span class="article-author">${escapeHtml(entry.author || "Residualsun")}</span>`;
  const subtitle = entry.homeDescription ? `<p class="article-subtitle">${escapeHtml(entry.homeDescription)}</p>` : "";
  const updatedDate = entry.updatedDate || entry.date;
  const modificationCount = Math.max(0, Number(entry.modificationCount) || 0);
  const articleHistory = `<span class="article-history">
            <time datetime="${escapeHtml(updatedDate)}">修改于：${formatDate(updatedDate)}</time>
            <span class="article-history-separator" aria-hidden="true">·</span>
            <span>已修改 ${modificationCount} 次</span>
          </span>`;
  const tags = entry.tags.length ? `<ul class="article-tags" aria-label="文章标签">${entry.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>` : "";
  const pagination = articlePagination(previousEntry, nextEntry);
  return layout({
    title: `${entry.title} — Residualsun`,
    description: entry.description,
    pathname: entry.href,
    bodyClass: `detail detail-${entry.group.key} detail-editorial`,
    audio: hasAudio(entry.body),
    metingAudio: hasMetingAudio(entry.body),
    math: hasMath(entry.body),
    content: `${siteHeader(entry.group.key)}
    <main class="article-shell">
      <header class="article-header">
        <h1>${escapeHtml(entry.title)}</h1>
        ${subtitle}
        <div class="article-meta">
          <div class="article-byline">
            <img class="article-avatar" src="/images/avatar.jpg" alt="作者头像" width="48" height="48">
            <div class="article-author-details">${author}<time class="article-published" datetime="${escapeHtml(entry.date)}">${formatDate(entry.date)}</time></div>
          </div>
          <div class="article-record">${articleHistory}${tags}</div>
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
    <script defer src="${assetUrl("/code-blocks.js")}"></script>
    <script defer src="${assetUrl("/toc.js")}"></script>`,
  });
}

function notFoundPage() {
  return layout({
    title: "页面不存在 — Residualsun",
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


export { collectionPage, notFoundPage };
