import { assetUrl } from "./assets.mjs";
import { renderMarkdown } from "./markdown.mjs";
import { siteHeader } from "./template.mjs";

const githubUrl = "https://github.com/residualsun1";
const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "numeric", day: "numeric", timeZone: "UTC",
});

function readingMinutes(body) {
  const { html } = renderMarkdown(body, { appendFootnotes: false });
  // Keep visible prose, including dialogue and link labels, without generated controls.
  const text = html
    .replace(/<div class="code-block">[\s\S]*?<\/pre>\s*<\/div>/g, " ")
    .replace(/<div class="prompt-toolbar">[\s\S]*?<\/button>\s*<\/div>/g, " ")
    .replace(/<p class="audio-meting-status"[^>]*>[^<]*<\/p>|<a class="audio-source-link"[^>]*>[^<]*<\/a>/g, " ")
    .replace(/<\/?(?:a|code|em|strong|del|kbd|mark|u)\b[^>]*>/g, "")
    .replace(/<[^>]*>|&lt;\/?[a-z][\w-]*(?:\s(?:(?!&(?:lt|gt);)[^\n])*)?\/?&gt;/gi, " ")
    .replaceAll("&#039;", "'")
    .replace(/&(?:amp|lt|gt|quot);/g, " ");
  const han = text.match(/\p{Script=Han}/gu)?.length ?? 0;
  const words = text.match(/\p{Script=Latin}[\p{Script=Latin}\p{M}]*(?:['’-]\p{Script=Latin}[\p{Script=Latin}\p{M}]*)*/gu)?.length ?? 0;
  return Math.max(1, Math.ceil((han + 2 * words) / 400));
}

function homepageEntries(collections) {
  return collections.flatMap(({ group, entries }) => entries.map((entry) => {
    const cover = typeof entry.cover === "string" ? entry.cover.trim() : "";
    const validCover = /^\/(?![\/\\])/.test(cover) || (/^https:\/\//i.test(cover) && URL.canParse(cover));
    return {
      href: entry.href,
      title: entry.title,
      summary: entry.description,
      homeDescription: entry.homeDescription,
      pinned: entry.pinned,
      author: entry.author,
      date: String(entry.date),
      minutes: readingMinutes(entry.body ?? ""),
      kind: group.label,
      tags: entry.tags,
      image: validCover ? cover : "",
      imageAlt: String(entry.coverAlt ?? "").trim() || `${entry.title} 的封面`,
      animated: entry.coverAnimated === "true",
    };
  })).sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)) || b.date.localeCompare(a.date));
}

function entryCard(entry, variant = "archive") {
  const isLead = variant === "lead";
  const summary = isLead ? entry.homeDescription : entry.summary;
  const data = variant === "archive"
    ? ` data-href="${escapeHtml(entry.href)}" data-kind="${escapeHtml(entry.kind)}" data-tags="${escapeHtml(JSON.stringify(entry.tags))}"`
    : "";
  const date = new Date(`${entry.date.slice(0, 10)}T00:00:00Z`);
  const dateTime = escapeHtml(entry.date);
  const fullDate = `${date.getUTCFullYear()} 年 ${date.getUTCMonth() + 1} 月 ${date.getUTCDate()} 日`;
  const details = [entry.kind, entry.author].filter(Boolean)
    .map((value) => `<span aria-hidden="true">·</span><span class="entry-meta-detail">${escapeHtml(value)}</span>`).join("");
  const image = entry.image ? `<a class="entry-image" href="${escapeHtml(entry.href)}" aria-label="阅读：${escapeHtml(entry.title)}"><img src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.imageAlt)}"${entry.animated && !isLead ? ' class="entry-cover--animated"' : ""} loading="${isLead ? "eager" : "lazy"}" fetchpriority="${isLead ? "high" : "auto"}" decoding="async"></a>` : "";
  return `<article class="entry entry--${variant}${entry.image ? "" : " entry--text-only"}" aria-label="${escapeHtml(entry.title)}"${data}>
    <time class="entry-date-full" datetime="${dateTime}">${fullDate}</time>
    ${image}
    <div class="entry-text">
      <h2><a href="${escapeHtml(entry.href)}">${escapeHtml(entry.title)}</a></h2>
      ${summary ? `<p class="entry-summary">${escapeHtml(summary)}</p>` : ""}
      <div class="entry-meta"><time class="entry-date-short" datetime="${dateTime}">${escapeHtml(dateFormatter.format(date))}</time><span class="entry-reading-time">${entry.minutes} 分钟</span>${details}</div>
    </div>
  </article>`;
}

export function homePage(collections) {
  const entries = homepageEntries(collections);
  const articles = entries.filter((entry) => entry.image && entry.kind !== "项目");
  const writings = articles.filter((entry) => entry.kind === "写作");
  const lead = writings.find((entry) => entry.pinned) ?? writings[0] ?? articles[0];
  const spotlights = articles.filter((entry) => entry !== lead).slice(0, 4);
  const tags = [...new Set(entries.flatMap((entry) => entry.tags))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  const siteUrl = String(process.env.SITE_URL || process.env.CF_PAGES_URL || "https://guozheng.dev").trim().replace(/\/+$/, "");
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Residualsun</title>
  <meta name="description" content="Residualsun 的写作、项目与阅读。">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#ffffff">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Residualsun">
  <meta property="og:description" content="Residualsun 的写作、项目与阅读。">
  <meta property="og:url" content="${escapeHtml(siteUrl)}/">
  <meta property="og:image" content="${escapeHtml(new URL("/images/avatar.jpg", `${siteUrl}/`).href)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Residualsun">
  <meta name="twitter:description" content="Residualsun 的写作、项目与阅读。">
  <meta name="twitter:image" content="${escapeHtml(new URL("/images/avatar.jpg", `${siteUrl}/`).href)}">
  <link rel="canonical" href="${escapeHtml(siteUrl)}/">
  <link rel="icon" type="image/png" href="${escapeHtml(assetUrl("/favicon.png"))}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link rel="stylesheet" href="${escapeHtml(assetUrl("/homepage.css"))}">
  <link rel="stylesheet" href="${escapeHtml(assetUrl("/fonts.css"))}">
  <link rel="stylesheet" href="${escapeHtml(assetUrl("/site-chrome.css"))}">
  <script src="${escapeHtml(assetUrl("/homepage.js"))}" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">跳到主要内容</a>
  <div class="homepage">
    ${siteHeader({ homepage: true })}
    <main id="main" tabindex="-1" class="page-width">
      ${lead ? `<section class="spotlight" aria-label="精选内容">
        ${entryCard(lead, "lead")}${spotlights.map((entry) => entryCard(entry, "small")).join("")}
      </section>` : ""}
      <div class="archive-layout">
        <section class="archive" id="archive" aria-label="内容归档">
          <span class="archive-anchor" id="projects" aria-hidden="true"></span>
          <span class="archive-anchor" id="writings" aria-hidden="true"></span>
          <span class="archive-anchor" id="readings" aria-hidden="true"></span>
          <div class="archive-toolbar">
            <div class="archive-filters" role="group" aria-label="按内容类型筛选">${["全部", "写作", "项目", "阅读"].map((kind) => `<button type="button" data-kind="${kind}" aria-pressed="${kind === "全部"}">${kind}</button>`).join("")}</div>
            <span class="result-count" aria-live="polite">${entries.length} 篇</span>
          </div>
          <div class="active-tag" hidden><span></span><button type="button">清除筛选</button></div>
          <div class="archive-grid">${entries.slice(0, 9).map((entry) => entryCard(entry)).join("")}</div>
          <button type="button" class="button see-all" aria-expanded="false" hidden>查看全部<span aria-hidden="true">›</span></button>
          <noscript><div class="archive-grid">${entries.slice(9).map((entry) => entryCard(entry)).join("")}</div></noscript>
          <template id="archive-cards">${entries.map((entry) => entryCard(entry)).join("")}</template>
        </section>
        <aside class="sidebar" id="about" aria-label="关于 Residualsun">
          <div class="profile">
            <img class="profile-avatar" src="/images/avatar.jpg" width="64" height="64" alt="Residualsun 头像" loading="lazy">
            <h2>Residualsun</h2><p>重要的是此时此刻</p>
            <nav class="profile-socials" aria-label="社交平台">
              <a href="https://x.com/Residualsun1/" target="_blank" rel="noreferrer" aria-label="X 个人主页"><img src="/icons/x.svg" width="16" height="16" alt=""><span>Residualsun</span></a>
              <a href="${githubUrl}" target="_blank" rel="noreferrer" aria-label="GitHub 个人主页"><img src="/icons/github.svg" width="16" height="16" alt=""><span>GitHub</span></a>
            </nav>
          </div>
          <div class="sidebar-index"><h2>标签</h2><nav class="tag-list" aria-label="文章标签">${tags.map((tag) => `<a href="#archive" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</a>`).join("")}</nav></div>
        </aside>
      </div>
      <footer class="rs-footer"><div class="rs-footer-title">Residualsun</div><nav aria-label="页脚导航"><a href="#about">关于</a><a href="#archive" data-nav-kind="全部">归档</a><a href="${githubUrl}" target="_blank" rel="noreferrer">GitHub</a></nav></footer>
    </main>
    <div class="rs-copyright">© ${new Date().getFullYear()} Residualsun</div>
  </div>
</body>
</html>`;
}
