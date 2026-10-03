import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { detailPage } from "../scripts/build.mjs";
import { homePage } from "../scripts/homepage.mjs";
import { createBuildQueue } from "../scripts/build-queue.mjs";
import { hasAudio, hasMath, hasMetingAudio, renderMarkdown } from "../scripts/markdown.mjs";

const root = new URL("../dist/client/", import.meta.url);
const fixtureRoot = new URL("./fixtures/", import.meta.url);
const groupDefinitions = [
  { key: "projects", label: "项目" },
  { key: "writings", label: "写作" },
  { key: "readings", label: "阅读" },
];

const readFixture = (path) => readFile(new URL(path, fixtureRoot), "utf8");

function fixtureEntry(group, overrides = {}) {
  return {
    title: "固定测试文章",
    description: "这是一篇不会发布的测试文章。",
    author: "测试作者",
    date: "2026-01-02",
    tags: ["测试"],
    href: `/${group.key}/fixture-current/`,
    group,
    body: "",
    ...overrides,
  };
}

async function groupDirectoryNames(groupKey) {
  const entries = await readdir(new URL(`${groupKey}/`, root), { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

test("构建产物可独立部署并包含基础上线文件", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const notFound = await readFile(new URL("404.html", root), "utf8");
  const robots = await readFile(new URL("robots.txt", root), "utf8");
  const headers = await readFile(new URL("_headers", root), "utf8");
  const favicon = await readFile(new URL("favicon.png", root));
  const version = JSON.parse(await readFile(new URL("version.json", root), "utf8"));
  const buildSource = await readFile(new URL("../scripts/build.mjs", import.meta.url), "utf8");

  assert.doesNotMatch(html, /chatgpt\.site/);
  const faviconVersion = createHash("sha256").update(favicon).digest("hex").slice(0, 12);
  assert.match(html, new RegExp(`href="/favicon\\.png\\?v=${faviconVersion}"`));
  assert.ok(favicon.length > 1_000);
  assert.match(html, /<meta name="theme-color" content="#ffffff">/);
  assert.match(html, /<meta name="robots" content="index, follow">/);
  assert.match(notFound, /<meta name="robots" content="noindex, follow">/);
  assert.match(notFound, /页面不存在/);
  assert.match(robots, /User-agent: \*\nAllow: \//);
  assert.match(headers, /Strict-Transport-Security: max-age=31536000; includeSubDomains/);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /\/version\.json[\s\S]*?Cache-Control: no-store/);
  assert.match(headers, /\/vendor\/aplayer\/1\.10\.1\/\*[\s\S]*?Cache-Control: public, max-age=31536000, immutable/);
  assert.match(headers, /\/vendor\/meting\/2\.0\.2\/\*[\s\S]*?Cache-Control: public, max-age=31536000, immutable/);
  assert.match(buildSource, /process\.env\.SITE_URL \|\| process\.env\.CF_PAGES_URL/);
  assert.match(html, /href="\/homepage\.css\?v=[0-9a-f]{12}"/);
  assert.match(version.assetVersion, /^[0-9a-f]{12}$/);
  assert.equal(version.commit, process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || "local");
});

function decodeHtml(value) {
  return value.replaceAll("&quot;", '"').replaceAll("&#039;", "'")
    .replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
}

function archiveCards(html) {
  return [...html.matchAll(/<article class="entry entry--archive(?: [^"]+)?"[\s\S]*?<\/article>/g)]
    .map(([card]) => ({
      card,
      href: decodeHtml(card.match(/data-href="([^"]+)"/)?.[1] || ""),
      kind: decodeHtml(card.match(/data-kind="([^"]+)"/)?.[1] || ""),
      tags: JSON.parse(decodeHtml(card.match(/data-tags="([^"]*)"/)?.[1] || "[]")),
    }));
}

test("编辑式首页包含完整文章、可筛选标签和无脚本阅读入口", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const template = html.match(/<template id="archive-cards">([\s\S]*?)<\/template>/)?.[1] || "";
  const cards = archiveCards(template);
  const firstGrid = html.slice(html.indexOf('<div class="archive-grid">'), html.indexOf('<button type="button" class="button see-all"'));
  const additionalGrid = html.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] || "";
  const expected = [];
  const articleTags = new Set();

  for (const { key, label } of groupDefinitions) {
    for (const slug of await groupDirectoryNames(key)) {
      const href = `/${key}/${slug}/`;
      expected.push(href);
      const page = await readFile(new URL(`${key}/${slug}/index.html`, root), "utf8");
      const tagList = page.match(/<ul class="article-tags"[^>]*>([\s\S]*?)<\/ul>/)?.[1] || "";
      const tags = [...tagList.matchAll(/<li>([^<]*)<\/li>/g)].map((match) => decodeHtml(match[1]));
      tags.forEach((tag) => articleTags.add(tag));
      const card = cards.find((entry) => entry.href === href);
      assert.ok(card, `首页应包含 ${href}`);
      assert.equal(card.kind, label);
      assert.deepEqual(card.tags, tags, `${href} 的筛选标签应来自文章本身`);
    }
  }

  assert.deepEqual(cards.map(({ href }) => href).sort(), expected.sort());
  assert.equal(archiveCards(firstGrid).length, Math.min(9, cards.length));
  assert.deepEqual(
    [...archiveCards(firstGrid), ...archiveCards(additionalGrid)].map(({ href }) => href).sort(),
    expected,
    "禁用 JavaScript 时仍能访问每篇文章",
  );
  const tags = [...html.matchAll(/<a href="#archive" data-tag="([^"]*)">/g)]
    .map((match) => decodeHtml(match[1]));
  assert.deepEqual(tags, [...articleTags].sort((a, b) => a.localeCompare(b, "zh-CN")));
  assert.match(html, /class="spotlight" aria-label="精选内容"/);
  assert.match(html, /class="rs-nav" aria-label="主导航"/);
  assert.match(html, /role="group" aria-label="按内容类型筛选"/);
  assert.match(html, /class="result-count" aria-live="polite"/);
  for (const label of ["首页", "写作", "项目", "阅读", "归档", "关于"]) {
    const nav = html.match(/<nav class="rs-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || "";
    assert.ok(nav.includes(`>${label}</a>`));
  }
  assert.match(html, /class="profile-socials" aria-label="社交平台"/);
  assert.match(html, /href="https:\/\/x\.com\/Residualsun1\/"/);
  assert.match(html, /href="https:\/\/github\.com\/residualsun1"/);
  assert.match(html, /重要的是此时此刻/);
  assert.doesNotMatch(html, /mailto:|class="hero-intro"|class="breadcrumb"/);
});

test("首页图片、图标、字体和筛选脚本均包含在静态构建中", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const css = await readFile(new URL("homepage.css", root), "utf8");
  const chrome = await readFile(new URL("site-chrome.css", root), "utf8");
  const detail = detailPage(fixtureEntry(groupDefinitions[0]));
  const script = await readFile(new URL("homepage.js", root), "utf8");
  assert.match(html, /src="\/homepage\.js\?v=[0-9a-f]{12}"[^>]*defer/);
  assert.doesNotMatch(html, /_next\/|react-dom|next\/|cdn\.tailwindcss/);
  assert.match(css, /\.homepage\s*\{[\s\S]*?--rs-serif:\s*var\(--rs-reading\)/);
  assert.match(chrome, /--rs-brand-font:\s*"Libre Baskerville"/);
  assert.match(html, /class="rs-brand"/);
  assert.match(detail, /class="rs-brand"/);
  assert.doesNotMatch(detail, /homepage\.css|cormorant-garamond/);
  assert.match(detail, /href="\/reader\.css\?v=[0-9a-f]{12}"/);
  assert.match(script, /addEventListener\("hashchange"/);
  assert.match(script, /aria-pressed/);
  assert.match(script, /aria-expanded/);
  const resources = new Set([
    ...[...html.matchAll(/<img[^>]*src="([^"]+)"/g)].map((match) => match[1]),
    ...[...css.matchAll(/url\("(\/fonts\/[^"?#]+\.woff2)"\)/g)].map((match) => match[1]),
    "/icons/github.svg", "/icons/x.svg", "/fonts/libre-baskerville-latin.woff2",
  ]);
  for (const resource of resources) {
    if (!resource.startsWith("/")) continue;
    const bytes = await readFile(new URL(resource.slice(1).split("?")[0], root));
    assert.ok(bytes.length > 0, `${resource} 应包含在静态部署产物中`);
    if (resource.endsWith(".woff2")) assert.equal(bytes.subarray(0, 4).toString("ascii"), "wOF2");
    if (resource.endsWith(".webp")) {
      assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF");
      assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP");
    }
  }
});

test("后续新文章自动进入首页，封面保留 GIF/WebP 且内容安全转义", () => {
  const group = groupDefinitions[0];
  const entries = Array.from({ length: 12 }, (_, index) => fixtureEntry(group, {
    slug: `fixture-${index}`,
    href: `/projects/fixture-${index}/`,
    title: `新文章 ${index} <script>`,
    description: "内容包含 </template> 与 & 符号",
    author: '作者 "A"',
    date: `2026-01-${String(index + 1).padStart(2, "0")}`,
    tags: [index % 2 ? "阅读 & 讨论" : "AI", '标签 "A"'],
    cover: index === 11 ? "/images/new-cover.gif" : index === 10 ? "/images/new-cover.webp" : "",
    coverAlt: '封面 "A"',
  }));
  const html = homePage([{ group, entries }]);
  const template = html.match(/<template id="archive-cards">([\s\S]*?)<\/template>/)?.[1] || "";
  const cards = archiveCards(template);
  assert.equal(cards.length, entries.length);
  assert.equal(cards[0].href, "/projects/fixture-11/");
  assert.deepEqual(cards[0].tags, entries[11].tags);
  assert.match(html, /src="\/images\/new-cover\.gif"/);
  assert.match(html, /src="\/images\/new-cover\.webp"/);
  assert.match(html, /class="entry entry--archive entry--text-only"/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;\/template&gt; 与 &amp; 符号/);
  assert.doesNotMatch(template, /<script>|<\/template>/);
  assert.equal((html.match(/data-tag=/g) || []).length, 3);
});

test("项目、写作和阅读归档页采用聚焦且无摘要的布局", async () => {
  const projects = await readFile(new URL("projects/index.html", root), "utf8");
  const writings = await readFile(new URL("writings/index.html", root), "utf8");
  const readings = await readFile(new URL("readings/index.html", root), "utf8");
  const css = await readFile(new URL("styles.css", root), "utf8");

  assert.match(projects, /<body class="listing listing-projects">/);
  assert.match(projects, /<h1>项目<\/h1>/);
  assert.ok((projects.match(/class="writing-row"/g) ?? []).length >= 1);
  assert.doesNotMatch(projects, /<\/strong>\s*<span>/);
  assert.match(writings, /class="collection-shell"/);
  assert.match(writings, /<body class="listing listing-writings">/);
  assert.match(writings, /<h1>写作<\/h1>/);
  assert.match(writings, /class="writing-row" href="\/writings\/[^"/]+\/"/);
  assert.doesNotMatch(writings, /<\/strong>\s*<span>/);
  assert.match(readings, /<h1>阅读<\/h1>/);
  assert.doesNotMatch(readings, /<\/strong>\s*<span>/);
  assert.match(css, /\.listing \.collection-shell \{[\s\S]*?760px/);
  assert.match(css, /\.collection-header h1 \{[\s\S]*?color: #1a1a1a;[\s\S]*?font-weight: 400;[\s\S]*?letter-spacing: -0\.02em;/);
  assert.match(css, /\.listing \.writing-row \{[\s\S]*?padding: 16px 4px;[\s\S]*?border-bottom: 0;/);
  assert.match(css, /\.listing \.writing-copy strong \{[\s\S]*?color: #1a1a1a;[\s\S]*?font-size: 17px;[\s\S]*?font-weight: 400;[\s\S]*?letter-spacing: -0\.01em;/);
});

test("固定夹具保留参考资料标题，不依赖正式文章", async () => {
  const fixture = await readFixture("markdown/legacy-features.md");
  const { html } = renderMarkdown(fixture);
  assert.match(html, /<h2 id="参考资料">参考资料<\/h2>/);
});

test("按年份分层的 Markdown 文件保持原有栏目 URL", async () => {
  for (const { key } of groupDefinitions) {
    const archive = await readFile(new URL(`${key}/index.html`, root), "utf8");
    assert.doesNotMatch(archive, new RegExp(`href="/${key}/\\d{4}/`));
  }
});

test("固定夹具覆盖旧 Hugo 语法与详情页结构", async () => {
  const fixture = await readFixture("markdown/legacy-features.md");
  const group = groupDefinitions.find(({ key }) => key === "writings");
  const current = fixtureEntry(group, { body: fixture });
  const previous = fixtureEntry(group, {
    title: "较早的测试文章",
    href: "/writings/fixture-previous/",
  });
  const next = fixtureEntry(group, {
    title: "较新的测试文章",
    href: "/writings/fixture-next/",
  });
  const rendered = renderMarkdown(fixture).html;
  const page = detailPage(current, previous, next);

  assert.match(rendered, /class="notice-box notice-content"/);
  assert.match(rendered, /class="table-scroll"/);
  assert.match(rendered, /class="footnotes"/);
  assert.match(rendered, /class="image-loop"/);
  assert.match(rendered, /<mark>/);
  assert.match(rendered, /<details>/);
  assert.match(rendered, /<summary>查看测试内容<\/summary>/);
  assert.match(page, /class="article-toc"/);
  assert.doesNotMatch(page, /class="breadcrumb"/);
  assert.match(page, /class="rs-header"/);
  assert.match(page, /class="rs-brand"/);
  assert.match(page, /class="article-pagination"/);
  assert.match(page, /上一篇文章/);
  assert.match(page, /下一篇文章/);
  assert.match(page, /href="\/writings\/fixture-previous\/"/);
  assert.match(page, /href="\/writings\/fixture-next\/"/);
  assert.doesNotMatch(page, /class="article-description"/);
  assert.match(page, /class="article-author">测试作者<\/span>/);
  assert.match(page, /class="article-tags"/);
  assert.match(page, /<li>测试<\/li>/);
  assert.match(page, /src="\/code-blocks\.js(?:\?v=[0-9a-f]{12})?"/);
});

test("归档和翻页链接只指向当前存在的文章", async () => {
  for (const { key } of groupDefinitions) {
    const directoryNames = await groupDirectoryNames(key);
    const existingSlugs = new Set(directoryNames);
    const archive = await readFile(new URL(`${key}/index.html`, root), "utf8");
    const archiveTargets = [...archive.matchAll(new RegExp(`href="/${key}/([^/]+)/"`, "g"))]
      .map((match) => match[1]);

    for (const target of archiveTargets) {
      assert.ok(existingSlugs.has(target), `归档链接必须指向当前存在的页面：${key}/${target}`);
    }

    for (const slug of directoryNames) {
      const page = await readFile(new URL(`${key}/${slug}/index.html`, root), "utf8");
      const pagination = page.match(/<nav class="article-pagination"[\s\S]*?<\/nav>/)?.[0] ?? "";
      const paginationTargets = [...pagination.matchAll(new RegExp(`href="/${key}/([^/]+)/"`, "g"))]
        .map((match) => match[1]);
      assert.equal((pagination.match(/class="article-pagination-item/g) ?? []).length, 2);
      for (const target of paginationTargets) {
        assert.ok(existingSlugs.has(target), `翻页链接必须指向当前存在的页面：${key}/${target}`);
      }
    }
  }
});

test("正文英数与中文正文、引用分别使用对应的阅读字体", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  const home = await readFile(new URL("index.html", root), "utf8");
  const fixture = await readFixture("markdown/legacy-features.md");
  const detailPages = Object.fromEntries(
    groupDefinitions.map((group) => [group.key, detailPage(fixtureEntry(group, { body: fixture }))]),
  );
  assert.match(css, /--source-han-serif:/);
  assert.match(css, /--body-reading: "Times New Roman"/);
  assert.match(css, /font-family: "FandolKai";[\s\S]*?local\("Kaiti"\)[\s\S]*?AR-PL-KaitiM-GB-from-yihui\.woff2/);
  assert.match(css, /font-family: "FandolKai TC";[\s\S]*?local\("Kaiti TC"\)[\s\S]*?\/fonts\/AR-PL-KaitiM-Big5\.woff2/);
  assert.match(css, /--body-kai: "Times New Roman", "FandolKai", "FandolKai TC", "Kaiti SC", "Kaiti TC"/);
  const traditionalKai = await readFile(new URL("fonts/AR-PL-KaitiM-Big5.woff2", root));
  assert.equal(traditionalKai.subarray(0, 4).toString("ascii"), "wOF2");
  assert.doesNotMatch(home, /lxgw-wenkai-webfont/);
  assert.match(css, /\.prose \{[\s\S]*?font-family: var\(--body-reading\)/);
  assert.match(css, /\.prose blockquote \{[\s\S]*?font-family: var\(--body-kai\)/);
  assert.doesNotMatch(css, /body\.detail-writings \{/);
  assert.match(css, /\.detail-editorial \.prose \{[\s\S]*?font-size: 15\.5px/);
  assert.match(css, /\.detail-editorial \.prose blockquote \{[\s\S]*?background: transparent/);
  assert.match(css, /\.detail-editorial \.article-pagination \{[\s\S]*?border-top: 0/);
  for (const { key } of groupDefinitions) {
    assert.match(detailPages[key], new RegExp(`<body class="detail detail-${key} detail-editorial">`));
    assert.match(detailPages[key], /class="article-published" datetime="2026-01-02">2026\.01\.02/);
    assert.match(detailPages[key], /class="article-history">[\s\S]*?修改于：2026\.01\.02[\s\S]*?已修改 0 次/);
    assert.doesNotMatch(detailPages[key], /class="article-description"/);
    assert.match(detailPages[key], /<div class="article-main">[\s\S]*?<nav class="article-pagination"/);
    assert.doesNotMatch(detailPages[key], /class="eyebrow"/);
  }
});

test("详情页根据完整 Git 历史显示最后修改日期与修改次数", async () => {
  const buildSource = await readFile(new URL("../scripts/build.mjs", import.meta.url), "utf8");
  const css = await readFile(new URL("styles.css", root), "utf8");

  assert.match(buildSource, /gitOutput\(\["log", "--follow", "--format=%cs", "--", relativePath\]\)/);
  assert.match(buildSource, /modificationCount: Math\.max\(0, dates\.length - 1\)/);
  assert.match(buildSource, /gitOutput\(\["fetch", "--unshallow", "--quiet", "origin"\]\)/);
  assert.match(css, /\.article-history \{[\s\S]*?display: inline-flex;[\s\S]*?flex-wrap: wrap;/);

  for (const { key } of groupDefinitions) {
    const directories = await groupDirectoryNames(key);
    for (const slug of directories) {
      const page = await readFile(new URL(`${key}/${slug}/index.html`, root), "utf8");
      assert.match(page, /class="article-published" datetime="\d{4}-\d{2}-\d{2}">\d{4}\.\d{2}\.\d{2}/);
      assert.match(page, /class="article-history">[\s\S]*?修改于：\d{4}\.\d{2}\.\d{2}[\s\S]*?已修改 \d+ 次/);
    }
  }
});

test("移动端 notice、宽表格和文章翻页卡片不会破坏版面", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  const fixture = await readFixture("markdown/legacy-features.md");
  const writing = renderMarkdown(fixture).html;

  assert.match(writing, /<fieldset class="notice-box notice-content">[\s\S]*?<div class="table-scroll">/);
  assert.match(css, /\.table-scroll \{[\s\S]*?overflow-x: auto;[\s\S]*?max-width: 100%;/);
  assert.match(css, /\.notice-box \{[\s\S]*?min-inline-size: 0;[\s\S]*?max-width: 100%;/);
  assert.match(css, /\.notice-box \{[\s\S]*?border-left: 3px solid var\(--notice-accent\);[\s\S]*?background: var\(--paper-surface\), var\(--notice-surface\);/);
  assert.match(css, /\.notice-box legend \{[\s\S]*?border: 0;[\s\S]*?background: transparent;[\s\S]*?font-size: 15px;[\s\S]*?font-weight: 700;/);
  assert.doesNotMatch(css, /\.notice-box legend \{[\s\S]*?border-radius: 9999px;/);
  assert.match(css, /\.notice-info \{[\s\S]*?--notice-surface: #e2e9e5;[\s\S]*?--notice-accent: #3f6664;/);
  assert.match(css, /\.notice-body \{[\s\S]*?min-width: 0;/);
  assert.match(css, /\.article-pagination-item \{[\s\S]*?background: var\(--paper-surface\), var\(--background-100\);/);
  assert.match(css, /a\.article-pagination-item:hover \{[\s\S]*?background: var\(--paper-surface\), #f5f5f5;/);
  assert.match(css, /@media \(max-width: 600px\) \{[\s\S]*?\.notice-box \{ margin-inline: 0; \}/);
});

test("全站使用白底、近黑文字与中性灰界面层", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.match(css, /--background-100: #fff;/);
  assert.match(css, /--paper-surface: none;/);
  assert.match(css, /--gray-1000: #151515;/);
  assert.match(css, /--gray-700: #737373;/);
  assert.match(css, /--accent-700: #151515;/);
  assert.match(css, /--surface-raised: rgba\(248, 248, 248, 0\.94\);/);
  assert.match(css, /--surface-code-toolbar: #ededed;/);
  assert.doesNotMatch(css, /(?:radial|linear)-gradient\(/);
  assert.match(css, /body \{[\s\S]*?background: var\(--paper-surface\), var\(--background-100\)/);
  assert.match(css, /\.site-header \{[\s\S]*?background: var\(--paper-surface\), var\(--background-100\)/);
});

test("所有写作页面均不残留已知 Hugo 短代码", async () => {
  const writingRoot = new URL("writings/", root);
  const directories = await readdir(writingRoot, { withFileTypes: true });
  for (const directory of directories.filter((entry) => entry.isDirectory())) {
    const html = await readFile(new URL(`${directory.name}/index.html`, writingRoot), "utf8");
    assert.doesNotMatch(html, /\{\{[%<]\s*(?:notice|imgloop)/i, directory.name);
  }
});

test("文章代码块包含语言类并被安全转义", async () => {
  const fixture = await readFixture("markdown/legacy-features.md");
  const html = renderMarkdown(fixture).html;
  assert.match(html, /class="code-toolbar"/);
  assert.match(html, /class="toolbar-left"><span class="toolbar-label">测试代码<\/span><\/div>/);
  assert.match(html, /class="toolbar-right"><button class="inline-prompt-copy-btn" title="Copy prompt">[\s\S]*?<rect x="4" y="8" width="12" height="12" rx="2" ry="2"><\/rect>[\s\S]*?<path d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"><\/path>/);
  assert.match(html, /<pre data-language="fiodor"><code class="language-fiodor" data-copy-source>/);
  assert.match(html, /称呼共识/);
});

test("代码块拥有本地高亮样式、复制按钮脚本与横向滚动", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  const script = await readFile(new URL("code-blocks.js", root), "utf8");
  const shellCode = renderMarkdown("```bash\nif true; then echo \'ok\'; fi\n```").html;
  const shellUrl = renderMarkdown("```bash\ncurl https://example.com/api\n```").html;
  const filenameCode = renderMarkdown('```python label="app.py"\nprint("hello")\n```').html;
  const escapedLabel = renderMarkdown('```javascript title="<script>"\nconst value = true;\n```').html;
  const chineseLabel = renderMarkdown("```流程\n输入 → 输出\n```").html;
  const asciiLabel = renderMarkdown("```ASCII 图\nA -> B\n```").html;
  assert.match(css, /\.prose pre \{[\s\S]*?overflow: auto/);
  assert.match(css, /--code-font:/);
  assert.match(css, /--surface-code: #f6f6f6;/);
  assert.match(css, /\.code-toolbar \{[\s\S]*?color: #595959;/);
  assert.match(css, /\.prose pre \{[\s\S]*?background: var\(--surface-code\)/);
  assert.match(css, /\.prose pre \{[\s\S]*?font-family: var\(--code-font\)/);
  assert.match(css, /\.prose pre code \{[\s\S]*?font-family: inherit/);
  assert.match(css, /\.code-block \{[\s\S]*?box-shadow:/);
  assert.match(css, /\.code-toolbar \{/);
  assert.match(css, /\.code-toolbar \{[\s\S]*?min-height: 40px;[\s\S]*?padding: 3px 10px 3px 14px/);
  assert.match(css, /\.token-keyword/);
  assert.match(css, /\.token-tag \{ color: #222; font-weight: 600; \}/);
  assert.match(css, /\.token-string \{ color: #555; \}/);
  assert.match(css, /\.token-property \{ color: #444; \}/);
  assert.match(css, /\.token-constant \{ color: #555; \}/);
  assert.match(script, /navigator\.clipboard/);
  assert.match(script, /\.prose \.code-block, \.prose \.prompt-block/);
  assert.match(script, /querySelector\("\.inline-prompt-copy-btn"\)/);
  assert.match(filenameCode, /class="toolbar-label">app\.py<\/span>/);
  assert.match(filenameCode, /class="language-python"/);
  assert.match(escapedLabel, /class="toolbar-label">&lt;script&gt;<\/span>/);
  assert.match(chineseLabel, /class="toolbar-label">流程<\/span>/);
  assert.match(chineseLabel, /data-language="text"/);
  assert.match(asciiLabel, /class="toolbar-label">ASCII 图<\/span>/);
  assert.doesNotMatch(filenameCode, /toolbar-dot|view-toggle|lang-inline-toggle/);
  assert.match(shellCode, /token-keyword">if<\/span>/);
  assert.match(shellCode, /token-string">&#039;ok&#039;<\/span>/);
  assert.doesNotMatch(shellUrl, /token-comment/);
});

test("Prompt 与 React 围栏生成可区分的对话组件并兼容中文旧写法", async () => {
  const prompt = renderMarkdown("```prompt\n请分析这段材料。\n保留关键证据。\n```").html;
  const legacyPrompt = renderMarkdown("```提示词\n你好！\n```").html;
  const react = renderMarkdown("```React\n这是 AI 的回应。\n```").html;
  const gptReact = renderMarkdown("```React lable-GPT\n这是 GPT 的回应。\n```").html;
  const claudeReact = renderMarkdown("```React label-Claude\n这是 Claude 的回应。\n```").html;
  const geminiReact = renderMarkdown('```React model="Gemini"\n这是 Gemini 的回应。\n```').html;
  const legacyReact = renderMarkdown("```回应\n这是旧文章中的回应。\n```").html;
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.match(prompt, /class="prompt-block"/);
  assert.match(prompt, /class="prompt-mark"[^>]*><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">[\s\S]*?<polyline points="16 18 22 12 16 6"><\/polyline>[\s\S]*?<polyline points="8 6 2 12 8 18"><\/polyline>/);
  assert.match(prompt, /class="prompt-content" data-copy-source>请分析这段材料。\n保留关键证据。/);
  assert.match(prompt, /class="inline-prompt-copy-btn" title="Copy prompt"/);
  assert.match(legacyPrompt, /class="prompt-block"/);
  assert.match(prompt, /<span>Prompt<\/span>/);
  assert.match(react, /class="prompt-block react-block"/);
  assert.match(react, /<span>React<\/span>/);
  assert.match(legacyReact, /class="prompt-block react-block"/);
  assert.doesNotMatch(prompt, /class="language-prompt"/);
  assert.doesNotMatch(react, /class="language-react"/);
  assert.match(gptReact, /chatgpt-icon\.svg/);
  assert.match(gptReact, /<span>GPT<\/span>/);
  assert.doesNotMatch(gptReact, />REACT<|>React<|prompt-model-label/);
  assert.match(claudeReact, /claude-ai-icon\.svg/);
  assert.match(claudeReact, /<span>Claude<\/span>/);
  assert.doesNotMatch(claudeReact, />REACT<|>React<|prompt-model-label/);
  assert.match(geminiReact, /google-gemini-icon\.svg/);
  assert.match(geminiReact, /<span>Gemini<\/span>/);
  assert.doesNotMatch(geminiReact, />REACT<|>React<|prompt-model-label/);
  assert.doesNotMatch(react, /class="prompt-model-icon"/);
  assert.match(css, /--codex-ui-font:/);
  assert.match(css, /\.prompt-content \{[\s\S]*?font-family: var\(--codex-ui-font\)/);
  assert.match(css, /\.prompt-content \{[\s\S]*?white-space: pre-wrap/);
  assert.match(css, /\.prompt-content \{[\s\S]*?padding: 13px 20px 16px/);
  assert.match(css, /\.prompt-mark svg \{ display: block; \}/);
  assert.match(css, /\.inline-prompt-copy-btn\.is-copied svg path \{[\s\S]*?opacity: 0/);
  assert.match(css, /--surface-prompt: var\(--surface-code\);/);
  assert.match(css, /--surface-prompt-toolbar: var\(--surface-code-toolbar\);/);
  assert.match(css, /--surface-react: #fff;/);
  assert.match(css, /--border-prompt: var\(--border-code\);/);
  assert.match(css, /--border-react: #e2e2e2;/);
  assert.match(css, /\.prompt-block \{[\s\S]*?background: var\(--surface-prompt\)/);
  assert.match(css, /\.react-block \{[\s\S]*?border: 0;[\s\S]*?background: var\(--surface-react\)[\s\S]*?box-shadow: 0 2px 8px rgba\(0, 0, 0, 0\.04\)/);
  assert.match(css, /\.react-block \.prompt-toolbar \{[\s\S]*?border-bottom-color: var\(--border-react\)/);
});

test("链接文字与普通正文中的 Markdown 斜体都能正常渲染", () => {
  const { html } = renderMarkdown("这是 *普通斜体*，以及 [*Her*](https://example.com/her)。");
  assert.match(html, /这是 <em>普通斜体<\/em>/);
  assert.match(html, /<a href="https:\/\/example\.com\/her"[^>]*><em>Her<\/em><\/a>/);
});

test("正文支持安全的无属性下划线标签", async () => {
  const underlined = renderMarkdown("这是 <u>带下划线的文字</u>，也支持 <U>大写标签</U>。").html;
  const unsafeAttribute = renderMarkdown('这是 <u onclick="alert(1)">不安全的标签</u>。').html;
  const css = await readFile(new URL("styles.css", root), "utf8");

  assert.match(underlined, /<p>这是 <u>带下划线的文字<\/u>，也支持 <u>大写标签<\/u>。<\/p>/);
  assert.doesNotMatch(unsafeAttribute, /<u\s+onclick=/i);
  assert.match(unsafeAttribute, /&lt;u onclick=&quot;alert\(1\)&quot;&gt;/);
  assert.match(css, /\.prose u \{[\s\S]*?text-decoration-line: underline;[\s\S]*?text-underline-offset: 0\.16em;/);
});

test("普通段落与引用保留 Markdown 行末双空格换行", () => {
  const paragraph = renderMarkdown("第一行。  \n第二行。").html;
  const quote = renderMarkdown("> **规划(Reasoning)**：第一行。  \n> **反应(Acting & Observing)**：第二行。").html;
  assert.match(paragraph, /第一行。<br>第二行。/);
  assert.match(quote, /<blockquote><p><strong>规划\(Reasoning\)<\/strong>：第一行。<br><strong>反应\(Acting &amp; Observing\)<\/strong>：第二行。<\/p><\/blockquote>/);
});

test("数学公式按需加载当前 KaTeX 自动渲染资源", async () => {
  assert.equal(hasMath("行内公式 $E = mc^2$"), true);
  assert.equal(hasMath("$$\\int_0^1 x^2 \\, dx$$"), true);
  assert.equal(hasMath("```text\n$这只是代码$\n```"), false);

  const mathPage = detailPage(fixtureEntry(groupDefinitions[1], { body: "行内公式 $E = mc^2$" }));
  const plainPage = detailPage(fixtureEntry(groupDefinitions[1], { body: "不包含公式的文章。" }));
  const mathScript = await readFile(new URL("math.js", root), "utf8");
  assert.match(mathPage, /katex@0\.18\.1/);
  assert.match(mathPage, /integrity="sha384-/);
  assert.match(mathPage, /src="\/math\.js\?v=[0-9a-f]{12}"/);
  assert.doesNotMatch(plainPage, /katex|\/math\.js/);
  assert.match(mathScript, /renderMathInElement/);
  assert.match(mathScript, /document\.querySelector\("\.prose"\)/);
});

test("文章音频安全渲染、原生降级并按需加载本地 APlayer", async () => {
  const source = '{{< audio title="测试 & 音频" artist="测试作者" url="https://media.example.com/song.mp3" cover="/images/cover.jpg" link="https://example.com/song" >}}';
  const rendered = renderMarkdown(source).html;
  const group = groupDefinitions.find(({ key }) => key === "projects");
  const audioPage = detailPage(fixtureEntry(group, { body: source }));
  const plainPage = detailPage(fixtureEntry(group, { body: "没有音频的正文。" }));
  const playerScript = await readFile(new URL("audio-player.js", root), "utf8");
  const playerCss = await readFile(new URL("vendor/aplayer/1.10.1/APlayer.min.css", root), "utf8");
  const playerLicense = await readFile(new URL("vendor/aplayer/1.10.1/LICENSE", root), "utf8");

  assert.equal(hasAudio(source), true);
  assert.equal(hasAudio(`\`\`\`md\n${source}\n\`\`\``), false);
  assert.doesNotMatch(renderMarkdown(`\`\`\`md\n${source}\n\`\`\``).html, /data-audio-player/);
  assert.doesNotMatch(renderMarkdown(`示例：\`${source}\``).html, /data-audio-player/);
  assert.match(rendered, /class="audio-embed" data-audio-player/);
  assert.match(rendered, /data-audio-title="测试 &amp; 音频"/);
  assert.match(rendered, /<audio class="audio-native-fallback" controls preload="none" aria-label="播放：测试 &amp; 音频">/);
  assert.match(rendered, /<source src="https:\/\/media\.example\.com\/song\.mp3">/);
  assert.match(rendered, /rel="noreferrer">打开音频来源<\/a>/);
  assert.match(audioPage, /href="\/vendor\/aplayer\/1\.10\.1\/APlayer\.min\.css"/);
  assert.match(audioPage, /src="\/vendor\/aplayer\/1\.10\.1\/APlayer\.min\.js"[\s\S]*?src="\/audio-player\.js(?:\?v=[0-9a-f]{12})?"/);
  assert.doesNotMatch(audioPage, /Meting\.min\.js/);
  assert.doesNotMatch(plainPage, /APlayer\.min|audio-player\.js/);
  assert.match(playerScript, /autoplay: false/);
  assert.match(playerScript, /preload: "none"/);
  assert.match(playerScript, /if \(fallback\) fallback\.hidden = true/);
  assert.match(playerCss, /\.aplayer\{/);
  assert.match(playerLicense, /MIT License/);
});

test("文章音频拒绝不安全地址并转义文字", () => {
  const warnings = [];
  const unsafe = renderMarkdown('{{< audio title="<script>alert(1)</script>" url="javascript:alert(1)" >}}', { warnings }).html;
  const http = renderMarkdown('{{< audio url="http://media.example.com/song.mp3" >}}').html;

  assert.match(unsafe, /<strong>音频不可用<\/strong>/);
  assert.doesNotMatch(unsafe, /javascript:alert/);
  assert.match(http, /<strong>音频不可用<\/strong>/);
  assert.equal(warnings.length, 1);
});

test("网易云音频支持结构化 ID 与页面 URL，并单独按需加载 MetingJS", async () => {
  const structured = '{{< audio server="netease" type="song" id="28226058" >}}';
  const compatibleUrl = '{{< audio url="https://music.163.com/#/playlist?id=60198" >}}';
  const group = groupDefinitions.find(({ key }) => key === "projects");
  const structuredHtml = renderMarkdown(structured).html;
  const compatibleHtml = renderMarkdown(compatibleUrl).html;
  const metingPage = detailPage(fixtureEntry(group, { body: structured }));
  const directPage = detailPage(fixtureEntry(group, { body: '{{< audio url="/audio/song.mp3" >}}' }));
  const metingScript = await readFile(new URL("vendor/meting/2.0.2/Meting.min.js", root));
  const metingLicense = await readFile(new URL("vendor/meting/2.0.2/LICENSE", root), "utf8");
  const playerScript = await readFile(new URL("audio-player.js", root), "utf8");
  const siteCss = await readFile(new URL("styles.css", root), "utf8");

  assert.equal(hasAudio(structured), true);
  assert.equal(hasMetingAudio(structured), true);
  assert.equal(hasMetingAudio(compatibleUrl), true);
  assert.equal(hasMetingAudio(`\`\`\`md\n${structured}\n\`\`\``), false);
  assert.match(structuredHtml, /<meting-js server="netease" type="song" id="28226058"/);
  assert.match(structuredHtml, /autoplay="false"[\s\S]*?preload="none"/);
  assert.doesNotMatch(structuredHtml, /lrc-type=/);
  assert.match(structuredHtml, /class="audio-meting-status" role="status"/);
  assert.doesNotMatch(structuredHtml, /audio-caption|audio-source-link|打开音乐来源/);
  assert.match(compatibleHtml, /<meting-js server="netease" type="playlist" id="60198"/);
  assert.doesNotMatch(compatibleHtml, /audio-caption|audio-source-link|打开音乐来源/);
  assert.match(metingPage, /src="\/vendor\/aplayer\/1\.10\.1\/APlayer\.min\.js"[\s\S]*?src="\/vendor\/meting\/2\.0\.2\/Meting\.min\.js"[\s\S]*?src="\/audio-player\.js(?:\?v=[0-9a-f]{12})?"/);
  assert.doesNotMatch(directPage, /Meting\.min\.js/);
  assert.match(metingScript.toString("utf8"), /MetingJS v2\.0\.2/);
  assert.match(metingScript.toString("utf8"), /lrcType:\w+\.meta\.lrcType\|\|3/);
  assert.equal(createHash("sha256").update(metingScript).digest("hex"), "eb9e8f9f495fcdb8c583313a39db04905b1ac65d327b81d93b357c7c7f3f9d70");
  assert.match(metingLicense, /Copyright \(c\) 2019 metowolf/);
  assert.match(playerScript, /MutationObserver/);
  assert.match(playerScript, /status\.textContent = "播放器暂时无法加载。"/);
  assert.match(siteCss, /\.audio-embed\.is-enhanced \.audio-caption-title,[\s\S]*?display: none;/);
  assert.match(siteCss, /\.audio-embed\.is-enhanced \.audio-caption:not\(\.has-source-link\)[\s\S]*?display: none;/);
});

test("Markdown 无序与有序列表支持多层缩进", () => {
  const { html } = renderMarkdown("- Claude\n  - Web 网页\n    1. Chrome\n- Codex");
  assert.match(html, /<ul><li>Claude<ul><li>Web 网页<ol><li>Chrome<\/li><\/ol><\/li><\/ul><\/li><li>Codex<\/li><\/ul>/);
});

test("有序与无序列表项下方支持缩进引用", () => {
  const ordered = renderMarkdown("1. 文本\n  > *引用文本*\n2. 后续").html;
  const unordered = renderMarkdown("- 文本\n  > **引用文本**\n- 后续").html;
  assert.match(ordered, /<ol><li>文本<blockquote><p><em>引用文本<\/em><\/p><\/blockquote><\/li><li>后续<\/li><\/ol>/);
  assert.match(unordered, /<ul><li>文本<blockquote><p><strong>引用文本<\/strong><\/p><\/blockquote><\/li><li>后续<\/li><\/ul>/);
});

test("引用中的宽松有序列表保持连续编号", () => {
  const source = `> 1. **感知**：接收环境输入。
>
> 2. **思考**：形成行动计划。
>    * 规划
>    * 工具选择
>
> 3. **行动**：执行计划。`;
  const { html } = renderMarkdown(source);
  assert.equal((html.match(/<ol(?:\s|>)/g) ?? []).length, 1);
  assert.ok(html.indexOf("感知") < html.indexOf("思考"));
  assert.ok(html.indexOf("思考") < html.indexOf("行动"));
  assert.match(html, /<ol><li><strong>感知<\/strong>/);
  assert.match(renderMarkdown("3. 第三项\n4. 第四项").html, /<ol start="3">/);
});

test("正文引用与文末脚注编号均使用方括号", () => {
  const { html } = renderMarkdown("正文脚注[^note]。\n\n[^note]: 脚注内容");
  assert.match(html, /class="footnote-ref"><a[^>]*>\[1\]<\/a><\/sup>/);
  assert.match(html, /<li id="fn-note"><span class="footnote-number"[^>]*>\[1\]<\/span>脚注内容/);
  assert.match(html, /class="footnote-backref"[^>]*>&#8617;&#65038;<\/a>/);
  assert.doesNotMatch(html, /<a[^>]*>1<\/a><\/sup>/);
});

test("正文目录可独立滚动并随当前章节自动高亮", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  const fixture = await readFixture("markdown/legacy-features.md");
  const writingGroup = groupDefinitions.find(({ key }) => key === "writings");
  const page = detailPage(fixtureEntry(writingGroup, { body: fixture }));
  const tocScript = await readFile(new URL("toc.js", root), "utf8");
  assert.match(css, /\.article-toc > p \{[\s\S]*?font-size: 14\.5px/);
  assert.match(css, /\.article-toc a \{[\s\S]*?font-size: 13\.5px/);
  assert.match(css, /\.article-toc \{[\s\S]*?overflow-y: auto/);
  assert.match(css, /\.article-toc \{[\s\S]*?max-height: calc\(100vh - 120px\)/);
  assert.match(css, /\.article-toc \{[\s\S]*?overscroll-behavior-y: contain/);
  assert.match(css, /\.article-toc \{[\s\S]*?scrollbar-width: none/);
  assert.match(css, /\.article-toc::-webkit-scrollbar \{ display: none; \}/);
  assert.match(css, /\.article-toc a:hover,[\s\S]*?\.article-toc a\[aria-current="location"\][\s\S]*?color: var\(--gray-1000\)/);
  assert.match(page, /class="article-toc" aria-label="文章目录" tabindex="0"/);
  assert.match(page, /src="\/toc\.js(?:\?v=[0-9a-f]{12})?"/);
  assert.match(tocScript, /setAttribute\("aria-current", "location"\)/);
  assert.match(tocScript, /getBoundingClientRect\(\)\.top <= readingLine/);
  assert.match(tocScript, /window\.requestAnimationFrame\(updateActiveHeading\)/);
  assert.match(tocScript, /decodeURIComponent\(link\.hash\.slice\(1\)\)/);
  assert.match(tocScript, /event\.stopPropagation\(\)/);
  assert.match(tocScript, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
  assert.match(tocScript, /heading\.scrollIntoView\(\{ behavior, block: "start" \}\)/);
  assert.match(tocScript, /\{ capture: true \}/);
});

test("本地预览将连续文件变化合并为串行构建", async () => {
  let activeBuilds = 0;
  let maximumActiveBuilds = 0;
  let buildCount = 0;
  const releases = [];
  const build = async () => {
    buildCount += 1;
    activeBuilds += 1;
    maximumActiveBuilds = Math.max(maximumActiveBuilds, activeBuilds);
    await new Promise((resolve) => releases.push(resolve));
    activeBuilds -= 1;
  };
  const enqueueBuild = createBuildQueue(build);

  const first = enqueueBuild();
  await new Promise((resolve) => setImmediate(resolve));
  const second = enqueueBuild();
  const third = enqueueBuild();
  assert.equal(buildCount, 1);
  releases.shift()();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(buildCount, 2);
  releases.shift()();
  await Promise.all([first, second, third]);

  assert.equal(maximumActiveBuilds, 1);
  assert.equal(buildCount, 2);
});

test("正文与引用中的西文使用 Times New Roman，引用中文使用网页楷体", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.match(css, /--body-reading: "Times New Roman"/);
  assert.match(css, /--body-kai: "Times New Roman", "FandolKai", "FandolKai TC", "Kaiti SC", "Kaiti TC"/);
  assert.match(css, /\.prose \{[\s\S]*?font-family: var\(--body-reading\)/);
  assert.match(css, /\.prose h1,[\s\S]*?\.prose h6 \{[\s\S]*?font-family: var\(--source-han-serif\)/);
  assert.match(css, /\.prose blockquote \{[\s\S]*?font-family: var\(--body-kai\)/);
  assert.match(css, /\.article-toc \{[\s\S]*?font-family: var\(--body-reading\)/);
  assert.match(css, /\.footnotes \{[\s\S]*?font-family: var\(--body-reading\)/);
  assert.match(css, /\.prose code \{[\s\S]*?font-family: var\(--code-font\)/);
});

test("所有正文的回到首页入口位于正文主列最左侧", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  for (const group of groupDefinitions) {
    const page = detailPage(fixtureEntry(group));
    assert.match(page, /<div class="article-main">[\s\S]*?<footer class="article-footer"><a href="\/">← 回到首页<\/a><\/footer>[\s\S]*?<\/div>/);
    assert.doesNotMatch(page, /回到写作|回到Prompt|回到阅读|回到项目/);
  }
  assert.match(css, /\.article-footer \{[\s\S]*?margin: 24px 0 96px/);
});

test("阅读界面拉丁标题使用 Libre Baskerville，代码保留代码字体", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.match(css, /--sans: "Libre Baskerville", Georgia/);
  assert.match(css, /--mono: "Libre Baskerville", Georgia/);
  assert.match(css, /--serif: "Libre Baskerville", Georgia/);
  assert.match(css, /--source-han-serif: "Libre Baskerville", Georgia/);
  assert.match(css, /--kai: "FandolKai", "Kaiti SC"/);
  assert.match(css, /--editorial: "Libre Baskerville", Georgia/);
  assert.match(css, /\.prose code \{[\s\S]*?font-family: var\(--code-font\)/);
  assert.match(css, /\.prose pre \{[\s\S]*?font-family: var\(--code-font\)/);
});

test("通用 Markdown 扩展可独立渲染", () => {
  const source = `
| 名称 | 状态 |
| :--- | ---: |
| Demo | 完成 |

- [x] 表格
- [ ] 后续任务

这是~~旧结论~~新结论[^note]，参见[文档][docs]。

[^note]: 脚注内容
[docs]: https://example.com "示例"
`;
  const { html, warnings } = renderMarkdown(source);
  assert.equal(warnings.length, 0);
  assert.match(html, /<table>/);
  assert.match(html, /type="checkbox" disabled checked/);
  assert.match(html, /<del>旧结论<\/del>/);
  assert.match(html, /class="footnotes"/);
  assert.match(html, /href="https:\/\/example.com"/);
});
