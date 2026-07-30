import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { detailPage, projectCard } from "../scripts/build.mjs";
import { hasMath, renderMarkdown } from "../scripts/markdown.mjs";

const root = new URL("../dist/client/", import.meta.url);
const fixtureRoot = new URL("./fixtures/", import.meta.url);
const groupDefinitions = [
  { key: "projects", label: "项目" },
  { key: "prompts", label: "Prompt" },
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
  const favicon = await readFile(new URL("favicon.svg", root), "utf8");
  const version = JSON.parse(await readFile(new URL("version.json", root), "utf8"));
  const buildSource = await readFile(new URL("../scripts/build.mjs", import.meta.url), "utf8");

  assert.doesNotMatch(html, /chatgpt\.site/);
  assert.match(
    html,
    new RegExp(`<link rel="icon" href="/favicon\\.svg\\?v=${version.assetVersion}" type="image/svg\\+xml">`),
  );
  assert.match(favicon, /viewBox="0 0 64 64"/);
  assert.match(favicon, /<title id="title">Huang<\/title>/);
  assert.match(favicon, /fill="#f2ede3"/);
  assert.match(favicon, /fill="#1d1b1b"/);
  assert.doesNotMatch(favicon, /<text\b/);
  assert.doesNotMatch(favicon, /#68C4FF|#0C79D8|#2E9EFF/i);
  assert.match(html, /<meta name="robots" content="index, follow">/);
  assert.match(notFound, /<meta name="robots" content="noindex, follow">/);
  assert.match(notFound, /页面不存在/);
  assert.match(robots, /User-agent: \*\nAllow: \//);
  assert.match(headers, /Strict-Transport-Security: max-age=31536000; includeSubDomains/);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /\/version\.json[\s\S]*?Cache-Control: no-store/);
  assert.match(headers, /\/images\/clawd\/\*[\s\S]*?Cache-Control: public, max-age=604800, stale-while-revalidate=86400/);
  assert.match(headers, /\/images\/projects\/\*[\s\S]*?Cache-Control: public, max-age=604800, stale-while-revalidate=86400/);
  assert.match(buildSource, /process\.env\.SITE_URL \|\| process\.env\.CF_PAGES_URL/);
  assert.match(html, new RegExp(`/styles\\.css\\?v=${version.assetVersion}`));
  assert.match(version.assetVersion, /^[0-9a-f]{12}$/);
  assert.equal(version.commit, process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || "local");
});

test("首页按项目、Prompt、写作、阅读顺序展示四个栏目", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const css = await readFile(new URL("styles.css", root), "utf8");
  const buildSource = await readFile(new URL("../scripts/build.mjs", import.meta.url), "utf8");
  assert.match(html, /class="site-header"/);
  assert.match(html, /class="brand-mark" aria-hidden="true">Huang/);
  assert.match(html, /family=Homemade\+Apple/);
  assert.doesNotMatch(html, /class="site-nav"/);
  assert.doesNotMatch(html, /class="home-toc"/);
  assert.doesNotMatch(html, /class="portrait-space"/);
  assert.doesNotMatch(html, /blog-static\/about\/gz\.jpg/);
  assert.match(css, /--brand-script: "Homemade Apple", cursive;/);
  assert.match(css, /\.brand-mark \{[\s\S]*?font-family: var\(--brand-script\);[\s\S]*?font-weight: 400;[\s\S]*?letter-spacing: 0;/);
  assert.match(css, /html \{[\s\S]*?-webkit-text-size-adjust: 100%;[\s\S]*?text-size-adjust: 100%;/);
  assert.match(css, /body \{[\s\S]*?-webkit-font-smoothing: antialiased;[\s\S]*?text-rendering: auto;/);
  assert.match(css, /\.brand-mark,[\s\S]*?\.prose h4 \{[\s\S]*?font-kerning: normal;[\s\S]*?text-rendering: optimizeLegibility;/);
  assert.match(html, /01 \/ 项目/);
  assert.match(html, /02 \/ Prompt/);
  assert.match(html, /03 \/ 写作/);
  assert.match(html, /04 \/ 阅读/);
  assert.doesNotMatch(html, /<h2 id="(?:projects|prompts|writings|readings)-title">/);
  assert.match(html, /class="project-row"/);
  assert.match(html, /class="writing-row"/);
  assert.doesNotMatch(html, /class="prompt-card"/);
  assert.doesNotMatch(html, /class="hero-scene"/);
  assert.doesNotMatch(html, /class="scene-frame"/);
  assert.doesNotMatch(html, /src="\/scene\.js"/);
  assert.match(html, /class="hero-intro"/);
  assert.match(html, /class="social-links"/);
  assert.match(html, /aria-label="X 个人主页"/);
  assert.match(html, /aria-label="GitHub 个人主页"/);
  assert.match(html, />Residualsun<\/span>/);
  assert.match(html, />Guozheng Huang<\/span>/);
  assert.ok(
    html.indexOf('aria-label="GitHub 个人主页"') < html.indexOf('aria-label="X 个人主页"'),
    "GitHub 应显示在 X 之前",
  );
  assert.match(html, /<p>你好，我是 Huang。<\/p>/);
  assert.match(html, /<p>我在探索 AI 与人文结合的可能性，希望能做出一些有意思的产品。<\/p>/);
  assert.doesNotMatch(html, /<h1 id="home-title">AI 学习与理解<\/h1>/);

  const projectSection = html.match(/<section class="content-section" id="projects"[\s\S]*?<\/section>/)?.[0] ?? "";
  const writingSection = html.match(/<section class="content-section" id="writings"[\s\S]*?<\/section>/)?.[0] ?? "";
  const promptSection = html.match(/<section class="content-section" id="prompts"[\s\S]*?<\/section>/)?.[0] ?? "";
  const readingSection = html.match(/<section class="content-section" id="readings"[\s\S]*?<\/section>/)?.[0] ?? "";
  const archivePages = {
    projects: await readFile(new URL("projects/index.html", root), "utf8"),
    prompts: await readFile(new URL("prompts/index.html", root), "utf8"),
    writings: await readFile(new URL("writings/index.html", root), "utf8"),
    readings: await readFile(new URL("readings/index.html", root), "utf8"),
  };
  const archiveCount = (group) => (
    archivePages[group].match(group === "projects" ? /class="project-row"/g : /class="writing-row"/g) ?? []
  ).length;
  const homeCount = (section, group) => (
    section.match(group === "projects" ? /class="project-row"/g : /class="writing-row"/g) ?? []
  ).length;
  assert.ok(html.indexOf('id="projects"') < html.indexOf('id="prompts"'));
  assert.ok(html.indexOf('id="prompts"') < html.indexOf('id="writings"'));
  assert.ok(html.indexOf('id="writings"') < html.indexOf('id="readings"'));
  assert.equal(homeCount(projectSection, "projects"), Math.min(archiveCount("projects"), 3));
  assert.equal(homeCount(promptSection, "prompts"), Math.min(archiveCount("prompts"), 3));
  assert.equal(homeCount(writingSection, "writings"), Math.min(archiveCount("writings"), 3));
  assert.equal(homeCount(readingSection, "readings"), Math.min(archiveCount("readings"), 3));
  assert.match(buildSource, /byKey\.projects\.entries\.slice\(0, 3\)/);
  assert.match(buildSource, /byKey\.prompts\.entries\.slice\(0, 3\)/);
  assert.match(buildSource, /byKey\.writings\.entries\.slice\(0, 3\)/);
  assert.match(buildSource, /byKey\.readings\.entries\.slice\(0, 3\)/);
  assert.equal((promptSection.match(/<\/strong>\s*<span>/g) ?? []).length, homeCount(promptSection, "prompts"));
  assert.equal((writingSection.match(/<\/strong>\s*<span>/g) ?? []).length, homeCount(writingSection, "writings"));
  assert.equal((readingSection.match(/<\/strong>\s*<span>/g) ?? []).length, homeCount(readingSection, "readings"));
  assert.match(projectSection, /href="\/projects\/">所有项目/);
  assert.match(css, /\.home #projects \.section-more \{[\s\S]*?margin-top: 18px;/);
  assert.match(writingSection, /href="\/writings\/">所有文章/);
  assert.match(promptSection, /href="\/prompts\/">所有文章/);
  assert.match(readingSection, /href="\/readings\/">所有文章/);
});

test("项目、写作、Prompt 和阅读归档页采用聚焦且无摘要的布局", async () => {
  const projects = await readFile(new URL("projects/index.html", root), "utf8");
  const writings = await readFile(new URL("writings/index.html", root), "utf8");
  const prompts = await readFile(new URL("prompts/index.html", root), "utf8");
  const readings = await readFile(new URL("readings/index.html", root), "utf8");
  const css = await readFile(new URL("styles.css", root), "utf8");

  assert.match(projects, /<body class="listing listing-projects">/);
  assert.match(projects, /<h1>项目<\/h1>/);
  assert.ok((projects.match(/class="project-row"/g) ?? []).length >= 1);
  assert.match(writings, /class="collection-shell"/);
  assert.match(writings, /<body class="listing listing-writings">/);
  assert.match(writings, /<h1>写作<\/h1>/);
  assert.doesNotMatch(writings, /<\/strong>\s*<span>/);
  assert.match(prompts, /02 \/ Prompt/);
  assert.match(prompts, /<h1>Prompt<\/h1>/);
  assert.doesNotMatch(prompts, /<\/strong>\s*<span>/);
  assert.match(readings, /<h1>阅读<\/h1>/);
  assert.doesNotMatch(readings, /<\/strong>\s*<span>/);
  assert.match(css, /\.listing:not\(\.listing-projects\) \.collection-shell \{[\s\S]*?760px/);
  assert.match(css, /\.collection-header h1 \{[\s\S]*?color: #34312f;[\s\S]*?font-weight: 400;[\s\S]*?letter-spacing: -0\.02em;/);
  assert.match(css, /\.listing:not\(\.listing-projects\) \.writing-row \{[\s\S]*?padding: 16px 4px;[\s\S]*?border-bottom: 0;/);
  assert.match(css, /\.listing:not\(\.listing-projects\) \.writing-copy strong \{[\s\S]*?color: #34312f;[\s\S]*?font-size: 17px;[\s\S]*?font-weight: 400;[\s\S]*?letter-spacing: -0\.01em;/);
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

test("项目使用紧凑图标列表并展示详情入口与可选外部链接", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const css = await readFile(new URL("styles.css", root), "utf8");
  const projectSection = html.match(/<section class="content-section" id="projects"[\s\S]*?<\/section>/)?.[0] ?? "";
  const projectRowRule = css.match(/\.project-row \{[\s\S]*?\n\}/)?.[0] ?? "";
  const projectHoverRule = css.match(/\.project-row:hover \{[\s\S]*?\n\s*\}/)?.[0] ?? "";

  assert.match(projectSection, /class="project-list"/);
  assert.match(projectSection, /class="project-row-main" href="\/projects\/[^"]+\/"/);
  assert.match(projectSection, /class="project-icon project-icon--[^"]+"><img src="\/images\/projects\/[^"]+\.png" alt="" width="192" height="192" loading="lazy" decoding="async">/);
  assert.doesNotMatch(projectSection, /status-(?:label|active|completed)|迭代中|已完结/);
  assert.match(projectSection, />项目仓库<\/span>/);
  assert.match(projectSection, />项目地址<\/span>/);
  assert.doesNotMatch(projectSection, /更新于/);
  assert.doesNotMatch(projectSection, /project-card|card-arrow/);
  assert.doesNotMatch(css, /\.status-(?:label|dot|completed)/);
  assert.match(css, /\.project-list \{[\s\S]*?display: grid;[\s\S]*?width: min\(100%, 880px\);[\s\S]*?margin-inline: auto;/);
  assert.match(projectRowRule, /grid-template-columns: minmax\(0, 1fr\) auto;[\s\S]*?min-height: 96px;[\s\S]*?padding: 12px 4px;[\s\S]*?border-radius: var\(--radius-sm\);/);
  assert.doesNotMatch(projectRowRule, /var\(--paper-surface\)|gradient\(|backdrop-filter|transform:/);
  assert.match(css, /\.project-row \+ \.project-row \{[\s\S]*?border-top: 1px solid var\(--gray-alpha-400\);/);
  assert.match(css, /\.project-row-main \{[\s\S]*?grid-template-columns: 72px minmax\(0, 1fr\);[\s\S]*?gap: 18px;/);
  assert.match(css, /\.project-icon \{[\s\S]*?width: 72px;[\s\S]*?height: 72px;[\s\S]*?border-radius: 12px;/);
  assert.match(css, /\.project-icon--her \{ --project-icon-scale: 1\.12; \}/);
  assert.match(css, /\.project-row h3 \{[\s\S]*?font-size: 17px;[\s\S]*?line-height: 25px;[\s\S]*?white-space: nowrap;/);
  assert.match(css, /\.project-description \{[\s\S]*?font-size: 13\.5px;[\s\S]*?line-height: 22px;[\s\S]*?white-space: nowrap;/);
  assert.match(css, /\.project-row-actions \{[\s\S]*?gap: 20px;[\s\S]*?justify-content: flex-end;[\s\S]*?padding-left: 28px;/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\.project-row:hover \{[\s\S]*?background: rgba\(139, 69, 19, 0\.035\);/);
  assert.doesNotMatch(projectHoverRule, /transform:/);
  assert.match(css, /@media \(max-width: 600px\) \{[\s\S]*?\.project-row \{[\s\S]*?grid-template-columns: 1fr;[\s\S]*?padding: 10px 0;/);
  assert.match(css, /@media \(max-width: 600px\) \{[\s\S]*?\.project-icon \{[\s\S]*?width: 56px;[\s\S]*?height: 56px;/);
  assert.match(css, /@media \(max-width: 600px\) \{[\s\S]*?\.project-row-actions \{[\s\S]*?flex-wrap: wrap;[\s\S]*?margin-left: 70px;/);
});

test("项目外部链接的可用与缺失状态由固定夹具覆盖", () => {
  const group = groupDefinitions.find(({ key }) => key === "projects");
  const linkedCard = projectCard(fixtureEntry(group, {
    icon: "/images/projects/fixture.png",
    repository: "https://github.com/example/project",
    website: "https://example.com/project",
  }));
  const unlinkedCard = projectCard(fixtureEntry(group, {
    repository: "",
    website: "",
  }));

  assert.match(linkedCard, /href="https:\/\/github\.com\/example\/project"/);
  assert.match(linkedCard, /href="https:\/\/example\.com\/project"/);
  assert.match(linkedCard, /src="\/images\/projects\/fixture\.png"/);
  assert.doesNotMatch(linkedCard, /aria-disabled="true"/);
  assert.equal((unlinkedCard.match(/aria-disabled="true"/g) ?? []).length, 2);
  assert.match(unlinkedCard, /class="project-icon-fallback" aria-hidden="true">固<\/span>/);
  assert.match(unlinkedCard, /title="在项目 Markdown 中填写 repository"/);
  assert.match(unlinkedCard, /title="在项目 Markdown 中填写 website"/);
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
  assert.match(page, /class="breadcrumb"/);
  assert.match(page, /class="article-pagination"/);
  assert.match(page, /上一篇文章/);
  assert.match(page, /下一篇文章/);
  assert.match(page, /href="\/writings\/fixture-previous\/"/);
  assert.match(page, /href="\/writings\/fixture-next\/"/);
  assert.doesNotMatch(page, /class="article-description"/);
  assert.match(page, /class="article-author">测试作者<\/span>/);
  assert.match(page, /class="article-tags"/);
  assert.match(page, /<li>测试<\/li>/);
  assert.match(page, /src="\/code-blocks\.js"/);
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
  assert.match(css, /\.hero-intro \{[\s\S]*?font-family: var\(--source-han-serif\)/);
  for (const { key } of groupDefinitions) {
    assert.match(detailPages[key], new RegExp(`<body class="detail detail-${key} detail-editorial">`));
    assert.doesNotMatch(detailPages[key], /class="article-description"/);
    assert.match(detailPages[key], /<div class="article-main">[\s\S]*?<nav class="article-pagination"/);
    assert.doesNotMatch(detailPages[key], /class="eyebrow"/);
  }
  assert.doesNotMatch(detailPages.prompts, /<body class="detail detail-writings">/);
});

test("移动端 notice、宽表格和文章翻页卡片不会破坏纸张版面", async () => {
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
  assert.match(css, /a\.article-pagination-item:hover \{[\s\S]*?background: var\(--paper-surface\), #eee8de;/);
  assert.match(css, /@media \(max-width: 600px\) \{[\s\S]*?\.notice-box \{ margin-inline: 0; \}/);
});

test("首页后三个栏目在水平分隔线上展示对应状态的 Clawd", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const css = await readFile(new URL("styles.css", root), "utf8");
  const pets = html.match(/<picture class="section-pet"/g) ?? [];
  const assetNames = ["thinking", "notification", "idle"];
  const assetDimensions = {
    thinking: [127, 142],
    notification: [147, 157],
    idle: [127, 142],
  };
  const section = (key) => (
    html.match(new RegExp(`<section class="content-section" id="${key}"[\\s\\S]*?<\\/section>`))?.[0] ?? ""
  );

  assert.equal(pets.length, 3);
  for (const name of assetNames) {
    const animation = await readFile(new URL(`images/clawd/clawd-${name}.gif`, root));
    const still = await readFile(new URL(`images/clawd/clawd-${name}-still.png`, root));
    const expectedVersion = createHash("sha256")
      .update(still)
      .update(animation)
      .digest("hex")
      .slice(0, 12);
    const versionedReferences = html.match(
      new RegExp(`clawd-${name}-still\\.png\\?v=([0-9a-f]{12})[\\s\\S]*?clawd-${name}\\.gif\\?v=\\1`),
    );
    const [width, height] = assetDimensions[name];
    assert.equal(animation.subarray(0, 6).toString("ascii"), "GIF89a");
    assert.deepEqual([...still.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(animation.readUInt16LE(6), width);
    assert.equal(animation.readUInt16LE(8), height);
    assert.equal(still.readUInt32BE(16), width);
    assert.equal(still.readUInt32BE(20), height);
    assert.equal(versionedReferences?.[1], expectedVersion);
  }
  assert.doesNotMatch(section("projects"), /class="section-pet"/);
  assert.match(section("prompts"), /clawd-thinking-still\.png\?v=([0-9a-f]{12})[\s\S]*?clawd-thinking\.gif\?v=\1"[^>]*width="127" height="142"/);
  assert.match(section("writings"), /clawd-notification-still\.png\?v=([0-9a-f]{12})[\s\S]*?clawd-notification\.gif\?v=\1"[^>]*width="147" height="157"/);
  assert.match(section("readings"), /clawd-idle-still\.png\?v=([0-9a-f]{12})[\s\S]*?clawd-idle\.gif\?v=\1"[^>]*width="127" height="142"/);
  assert.match(html, /<picture class="section-pet" aria-hidden="true">/);
  assert.match(html, /media="\(prefers-reduced-motion: reduce\)"/);
  assert.doesNotMatch(html, /clawd-[^"]+\.gif\?v=[^"]+"[^>]*loading="lazy"/);
  assert.match(html, /clawd-[^"]+\.gif\?v=[^"]+"[^>]*decoding="async"/);
  assert.match(css, /\.section-kicker__rail::before \{/);
  assert.match(css, /background: var\(--gray-alpha-400\)/);
  assert.match(css, /\.section-heading \.section-kicker \{[\s\S]*?font-size: 14px/);
  assert.match(css, /\.section-heading \.section-kicker \{[\s\S]*?font-weight: 600/);
  assert.match(css, /\.section-pet \{[\s\S]*?right: 4px;[\s\S]*?height: 72px;/);
  assert.match(css, /\.section-pet img \{[\s\S]*?image-rendering: pixelated;/);
  assert.match(css, /@media \(min-width: 601px\) \{[\s\S]*?\.home-layout > \.content-section \+ \.content-section \{ padding-top: 48px; \}/);
  assert.match(css, /\.home-layout > #projects \{ padding-top: 15px; \}/);
  assert.match(css, /@media \(max-width: 600px\) \{[\s\S]*?\.section-pet \{[\s\S]*?height: 56px;/);
});

test("项目栏目在分隔线上展示可播放的唱片", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const css = await readFile(new URL("styles.css", root), "utf8");
  const playerScript = await readFile(new URL("music-player.js", root), "utf8");
  const audioFile = await readFile(new URL("audio/site-theme.mp3", root));
  const projectSection = html.match(/<section class="content-section" id="projects"[\s\S]*?<\/section>/)?.[0] ?? "";
  const promptSection = html.match(/<section class="content-section" id="prompts"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(css, /\.section-kicker__rail::before \{/);
  assert.match(css, /background: var\(--gray-alpha-400\)/);
  assert.match(css, /\.section-heading \.section-kicker \{[\s\S]*?font-size: 14px/);
  assert.match(css, /\.section-heading \.section-kicker \{[\s\S]*?font-weight: 600/);
  assert.match(projectSection, /class="vinyl-player" data-vinyl-player/);
  assert.match(projectSection, /来首 Huang，看看文章/);
  assert.match(projectSection, /aria-pressed="false"/);
  assert.match(projectSection, /<audio data-vinyl-audio data-src="\/audio\/site-theme\.mp3" preload="none"><\/audio>/);
  assert.doesNotMatch(promptSection, /data-vinyl-player/);
  assert.match(html, /<script defer src="\/music-player\.js"><\/script>/);
  assert.match(css, /\.vinyl-player__surface \{[\s\S]*?repeating-radial-gradient/);
  assert.match(css, /\.vinyl-player \{[\s\S]*?top: calc\(48px \+ 10px - 44px\);/);
  assert.match(css, /\.vinyl-player:hover \.vinyl-player__disc,[\s\S]*?translateY\(calc\(var\(--vinyl-rise\) \* -1\)\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.vinyl-player__button\[data-playing="true"\] \.vinyl-player__surface \{[\s\S]*?animation: none/);
  assert.match(playerScript, /audio\.volume = 0\.45/);
  assert.match(playerScript, /audio\.src = source/);
  assert.match(playerScript, /window\.addEventListener\("pagehide"/);
  assert.ok(audioFile.length > 1_000_000);
  assert.equal(audioFile.subarray(0, 3).toString("ascii"), "ID3");
});

test("首页使用 880px 中等宽度与无照片的单列简介", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  const heroRule = css.match(/\.hero \{([^}]*)\}/)?.[1] ?? "";
  assert.match(css, /\.home-layout \{[\s\S]*?padding-bottom: 112px/);
  assert.match(css, /\.home-layout \{[\s\S]*?width: min\(calc\(100% - 48px\), 880px\)/);
  assert.doesNotMatch(css, /\.portrait-space/);
  assert.doesNotMatch(heroRule, /grid-template-columns/);
  assert.match(css, /\.hero-copy \{ width: 100%; \}/);
  assert.doesNotMatch(css, /\.home-toc/);
});

test("全站使用均匀颗粒与斜向纸张纹理背景", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  const cssWithoutComponentTextures = css
    .replace(
      /--paper-surface:[\s\S]*?\) 0 0 \/ 8px 8px;/,
      "",
    )
    .replace(
      /\.vinyl-player__surface \{[\s\S]*?\n\}/,
      "",
    );

  assert.match(css, /--background-100: #f2ede3;/);
  assert.match(css, /--surface-raised: rgba\(250, 247, 241, 0\.8\);/);
  assert.match(
    css,
    /--paper-surface:[\s\S]*?rgba\(93, 75, 57, 0\.05\) 0 0\.45px,[\s\S]*?\) 0 0 \/ 4px 4px,[\s\S]*?rgba\(255, 255, 255, 0\.34\) 0 0\.4px,[\s\S]*?\) 2px 1px \/ 6px 6px/,
  );
  assert.match(
    css,
    /--paper-surface:[\s\S]*?linear-gradient\([\s\S]*?115deg[\s\S]*?rgba\(112, 90, 66, 0\.024\)[\s\S]*?\) 0 0 \/ 8px 8px/,
  );
  assert.doesNotMatch(css, /circle at 13% 7%|circle at 88% 18%/);
  assert.doesNotMatch(cssWithoutComponentTextures, /(?:radial|linear)-gradient\(/);
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
  assert.match(css, /--surface-code: #efe9df;/);
  assert.match(css, /\.prose pre \{[\s\S]*?background: var\(--surface-code\)/);
  assert.match(css, /\.prose pre \{[\s\S]*?font-family: var\(--code-font\)/);
  assert.match(css, /\.prose pre code \{[\s\S]*?font-family: inherit/);
  assert.match(css, /\.code-block \{[\s\S]*?box-shadow:/);
  assert.match(css, /\.code-toolbar \{/);
  assert.match(css, /\.code-toolbar \{[\s\S]*?min-height: 40px;[\s\S]*?padding: 3px 10px 3px 14px/);
  assert.match(css, /\.token-keyword/);
  assert.match(css, /\.token-tag \{ color: #98482f; font-weight: 600; \}/);
  assert.match(css, /\.token-string \{ color: #3f7156; \}/);
  assert.match(css, /\.token-property \{ color: #6b528c; \}/);
  assert.match(css, /\.token-constant \{ color: #a04f42; \}/);
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
  assert.match(css, /--surface-react: #ffffff;/);
  assert.match(css, /--border-prompt: var\(--border-code\);/);
  assert.match(css, /--border-react: #dcd6cd;/);
  assert.match(css, /\.prompt-block \{[\s\S]*?background: var\(--surface-prompt\)/);
  assert.match(css, /\.react-block \{[\s\S]*?border: 0;[\s\S]*?background: var\(--surface-react\)[\s\S]*?box-shadow: 0 2px 8px rgba\(0, 0, 0, 0\.04\)/);
  assert.match(css, /\.react-block \.prompt-toolbar \{[\s\S]*?border-bottom-color: var\(--border-react\)/);
});

test("链接文字与普通正文中的 Markdown 斜体都能正常渲染", () => {
  const { html } = renderMarkdown("这是 *普通斜体*，以及 [*Her*](https://example.com/her)。");
  assert.match(html, /这是 <em>普通斜体<\/em>/);
  assert.match(html, /<a href="https:\/\/example\.com\/her"[^>]*><em>Her<\/em><\/a>/);
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

  const buildSource = await readFile(new URL("../scripts/build.mjs", import.meta.url), "utf8");
  const mathScript = await readFile(new URL("math.js", root), "utf8");
  assert.match(buildSource, /katex@0\.18\.1/);
  assert.match(buildSource, /integrity="sha384-/);
  assert.match(mathScript, /renderMathInElement/);
  assert.match(mathScript, /document\.querySelector\("\.prose"\)/);
});

test("首页文章列表使用留白分组、Libre Baskerville 与棕色标题", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.match(css, /\.home \.writing-list \{ border-top: 0; \}/);
  assert.match(css, /\.home \.writing-row \{[\s\S]*?padding-block: \d+px;[\s\S]*?border-bottom: 0;/);
  assert.match(css, /\.writing-row \{[\s\S]*?grid-template-columns: 112px minmax\(0, 1fr\) 32px/);
  assert.match(css, /--title-serif: "Libre Baskerville"/);
  assert.match(css, /\.home \.writing-copy strong \{[\s\S]*?color: rgb\(139, 69, 19\)/);
  assert.match(css, /\.home \.writing-copy strong \{[\s\S]*?font-size: 16px/);
  assert.match(css, /\.home \.writing-copy strong \{[\s\S]*?font-weight: 700/);
  assert.match(css, /\.home \.writing-copy strong \{[\s\S]*?text-decoration-color: rgb\(190, 155, 128\)/);
  assert.match(css, /\.home \.writing-copy strong \{[\s\S]*?transition: text-decoration-color 0\.2s ease, text-decoration-thickness 0\.2s ease/);
  assert.match(css, /\.home \.writing-copy strong:hover \{[\s\S]*?text-decoration-color: rgb\(139, 69, 19\);[\s\S]*?text-decoration-thickness: 1\.5px/);
  assert.match(css, /\.home \.writing-row:hover \{ background: transparent; \}/);
  assert.match(css, /\.home \.writing-copy > span \{[\s\S]*?color: #74685d/);
  assert.match(css, /\.home \.writing-copy > span \{[\s\S]*?font-family: var\(--body-reading\)/);
  assert.match(css, /\.home \.writing-copy > span \{[\s\S]*?font-size: 13\.8px/);
  assert.match(css, /\.home \.writing-copy > span \{[\s\S]*?line-height: 23\.5px/);
  assert.match(css, /\.home \.writing-copy > span \{[\s\S]*?text-align: left/);
});

test("首页三段简介统一使用首段的字号颜色与字重", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.match(css, /\.hero-intro \{[\s\S]*?color: var\(--gray-1000\);[\s\S]*?font-size: 15px;[\s\S]*?font-weight: 400/);
  assert.match(css, /\.hero-intro p \{ margin: 0; color: inherit; font-size: inherit; font-weight: inherit; \}/);
  assert.doesNotMatch(css, /\.hero-intro p:first-child/);
});

test("社交入口使用指定的默认与悬浮颜色", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.match(css, /\.social-links \{[\s\S]*?color: rgb\(79, 77, 74\)/);
  assert.match(css, /border-bottom: 1px solid rgb\(197, 193, 187\)/);
  assert.match(css, /\.social-links a:hover \{ color: rgb\(29, 27, 27\); \}/);
  assert.match(css, /\.social-links a:hover span \{ border-bottom-color: rgb\(29, 27, 27\); \}/);
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
  assert.match(page, /src="\/toc\.js"/);
  assert.match(tocScript, /setAttribute\("aria-current", "location"\)/);
  assert.match(tocScript, /getBoundingClientRect\(\)\.top <= readingLine/);
  assert.match(tocScript, /window\.requestAnimationFrame\(updateActiveHeading\)/);
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

test("页眉页脚无分隔线且页脚显示邮箱", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  const html = await readFile(new URL("index.html", root), "utf8");
  const headerRule = css.match(/\.site-header \{([\s\S]*?)\}/)?.[1] ?? "";
  assert.doesNotMatch(headerRule, /border-bottom/);
  assert.match(headerRule, /background: var\(--paper-surface\), var\(--background-100\)/);
  assert.match(headerRule, /backdrop-filter: none/);
  assert.doesNotMatch(css, /\.site-footer \{[\s\S]*?border-top/);
  assert.match(html, /class="footer-email" href="mailto:Residualsun@proton\.me"[\s\S]*?<svg width="14" height="14"[\s\S]*?<span>Residualsun@proton\.me<\/span>/);
  assert.doesNotMatch(html, /持续学习，持续修订/);
  assert.match(css, /\.footer-email \{[\s\S]*?font-family: var\(--title-serif\)/);
  assert.match(css, /\.footer-email \{[\s\S]*?color: rgb\(79, 77, 74\)/);
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

test("普通拉丁文字统一使用 Libre Baskerville，代码保留代码字体", async () => {
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
