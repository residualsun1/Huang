import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { hasMath, renderMarkdown } from "../scripts/markdown.mjs";

const root = new URL("../dist/client/", import.meta.url);

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
  assert.match(html, /class="project-card"/);
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
  assert.match(html, /海外 AI 产品和概念的区分与关系梳理/);

  const projectSection = html.match(/<section class="content-section" id="projects"[\s\S]*?<\/section>/)?.[0] ?? "";
  const writingSection = html.match(/<section class="content-section" id="writings"[\s\S]*?<\/section>/)?.[0] ?? "";
  const promptSection = html.match(/<section class="content-section" id="prompts"[\s\S]*?<\/section>/)?.[0] ?? "";
  const readingSection = html.match(/<section class="content-section" id="readings"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.ok(html.indexOf('id="projects"') < html.indexOf('id="prompts"'));
  assert.ok(html.indexOf('id="prompts"') < html.indexOf('id="writings"'));
  assert.ok(html.indexOf('id="writings"') < html.indexOf('id="readings"'));
  assert.equal((projectSection.match(/class="project-card"/g) ?? []).length, 3);
  assert.equal((writingSection.match(/class="writing-row"/g) ?? []).length, 3);
  assert.equal((promptSection.match(/class="writing-row"/g) ?? []).length, 1);
  assert.equal((readingSection.match(/class="writing-row"/g) ?? []).length, 2);
  assert.match(buildSource, /byKey\.projects\.entries\.slice\(0, 3\)/);
  assert.match(buildSource, /byKey\.prompts\.entries\.slice\(0, 3\)/);
  assert.match(buildSource, /byKey\.writings\.entries\.slice\(0, 3\)/);
  assert.match(buildSource, /byKey\.readings\.entries\.slice\(0, 3\)/);
  assert.match(promptSection, /每一次对话，既是我在了解大模型，也是大模型在了解我/);
  assert.equal((promptSection.match(/<\/strong>\s*<span>/g) ?? []).length, 1);
  assert.equal((writingSection.match(/<\/strong>\s*<span>/g) ?? []).length, 3);
  assert.equal((readingSection.match(/<\/strong>\s*<span>/g) ?? []).length, 2);
  assert.match(projectSection, /href="\/projects\/">所有项目/);
  assert.match(css, /\.home #projects \.section-more \{[\s\S]*?margin-top: 24px;/);
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
  assert.ok((projects.match(/class="project-card"/g) ?? []).length >= 1);
  assert.match(writings, /class="collection-shell"/);
  assert.match(writings, /<body class="listing listing-writings">/);
  assert.match(writings, /<h1>写作<\/h1>/);
  assert.ok((writings.match(/class="writing-row"/g) ?? []).length >= 5);
  assert.doesNotMatch(writings, /<\/strong>\s*<span>/);
  assert.match(prompts, /02 \/ Prompt/);
  assert.match(prompts, /<h1>Prompt<\/h1>/);
  assert.match(prompts, /GPT-Live-Samantha/);
  assert.doesNotMatch(prompts, /<\/strong>\s*<span>/);
  assert.match(readings, /<h1>阅读<\/h1>/);
  assert.match(readings, /we-have-never-been-modern/);
  assert.match(readings, /the-spears-of-twilight/);
  assert.doesNotMatch(readings, /<\/strong>\s*<span>/);
  assert.match(css, /\.listing:not\(\.listing-projects\) \.collection-shell \{[\s\S]*?760px/);
  assert.match(css, /\.collection-header h1 \{[\s\S]*?color: #34312f;[\s\S]*?font-weight: 400;[\s\S]*?letter-spacing: -0\.02em;/);
  assert.match(css, /\.listing:not\(\.listing-projects\) \.writing-row \{[\s\S]*?padding: 16px 4px;[\s\S]*?border-bottom: 0;/);
  assert.match(css, /\.listing:not\(\.listing-projects\) \.writing-copy strong \{[\s\S]*?color: #34312f;[\s\S]*?font-size: 17px;[\s\S]*?font-weight: 400;[\s\S]*?letter-spacing: -0\.01em;/);
});

test("实际使用外部资料的文章均保留作者自定义的参考文献或参考资料标题", async () => {
  const paths = [
    "prompts/GPT-Live-Samantha/index.html",
    "readings/we-have-never-been-modern/index.html",
    "readings/the-spears-of-twilight/index.html",
    "writings/deploy-an-agent-with-python/index.html",
    "writings/what-is-agent/index.html",
    "writings/ai-products-and-concepts/index.html",
    "writings/cscw-in-bnu/index.html",
  ];

  for (const path of paths) {
    const html = await readFile(new URL(path, root), "utf8");
    assert.match(html, /<h2 id="[^"]*参考(?:文献|资料)">[^<]*参考(?:文献|资料)<\/h2>/);
  }
});

test("按年份分层的 Markdown 文件保持原有栏目 URL", async () => {
  const prompt = await readFile(new URL("prompts/GPT-Live-Samantha/index.html", root), "utf8");
  const writing = await readFile(new URL("writings/what-is-agent/index.html", root), "utf8");
  const reading = await readFile(new URL("readings/the-spears-of-twilight/index.html", root), "utf8");
  const project = await readFile(new URL("projects/global-enthnography/index.html", root), "utf8");

  assert.match(prompt, /Samantha 会理解我吗？/);
  assert.match(writing, /我眼中的智能体/);
  assert.match(reading, /暮光之矛/);
  assert.match(project, /全球民族志档案数据库/);
});

test("项目卡片使用统一纸张纹理并展示详情入口与可选外部链接", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const css = await readFile(new URL("styles.css", root), "utf8");
  const projectSection = html.match(/<section class="content-section" id="projects"[\s\S]*?<\/section>/)?.[0] ?? "";
  const projectCardRule = css.match(/\.project-card \{[\s\S]*?\n\}/)?.[0] ?? "";

  assert.match(projectSection, /class="project-card-link" href="\/projects\/global-enthnography\/"/);
  assert.match(projectSection, /class="card-arrow" aria-hidden="true">↗<\/span>[\s\S]*?class="project-card-copy"/);
  assert.doesNotMatch(projectSection, /status-(?:label|active|completed)|迭代中|已完结/);
  assert.match(projectSection, />项目仓库<\/span>/);
  assert.match(projectSection, />项目网址<\/span>/);
  assert.match(projectSection, /aria-disabled="true"/);
  assert.doesNotMatch(projectSection, /更新于/);
  assert.doesNotMatch(css, /\.status-(?:label|dot|completed)/);
  assert.match(projectCardRule, /--project-card-surface: #eee8de;/);
  assert.match(css, /\.project-grid \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 264px\)\);[\s\S]*?justify-content: center;/);
  assert.match(projectCardRule, /min-width: 0;[\s\S]*?min-height: 170px;[\s\S]*?padding: 25px;[\s\S]*?border: 1px solid var\(--project-card-border\);[\s\S]*?border-radius: var\(--radius-md\);/);
  assert.match(projectCardRule, /background: var\(--paper-surface\), var\(--project-card-surface\);/);
  assert.match(projectCardRule, /box-shadow:[\s\S]*?3px 4px 0 rgba\(61, 55, 48, 0\.1\),[\s\S]*?0 12px 24px rgba\(45, 41, 36, 0\.08\)/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\.project-card:hover \{[\s\S]*?transform: translateY\(-2px\);/);
  assert.doesNotMatch(projectCardRule, /gradient\(|backdrop-filter|filter:/);
  assert.match(css, /\.project-card \.card-arrow \{[\s\S]*?position: absolute;[\s\S]*?top: 18px;[\s\S]*?right: 18px;/);
  assert.match(css, /\.project-card h3 \{[\s\S]*?letter-spacing: 0\.03em/);
  assert.match(css, /\.project-card h3 \{[\s\S]*?font-size: 17\.5px;[\s\S]*?line-height: 27px;/);
  assert.match(css, /\.project-card-actions \{[\s\S]*?justify-content: space-between;[\s\S]*?padding-top: 14px;/);
  assert.match(css, /@media \(max-width: 960px\) \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 600px\) \{[\s\S]*?\.project-grid \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 600px\) \{[\s\S]*?\.project-card-actions \{[\s\S]*?flex-direction: column/);
  assert.match(css, /@media \(max-width: 600px\) \{[\s\S]*?\.project-action svg \{[\s\S]*?width: clamp\(9px, 2\.5vw, 12px\)/);
});

test("旧 Hugo 正文格式已转换为站点 HTML", async () => {
  const agent = await readFile(new URL("writings/what-is-agent/index.html", root), "utf8");
  const appStore = await readFile(new URL("writings/appstore-codex-plus/index.html", root), "utf8");
  const deploy = await readFile(new URL("writings/deploy-an-agent-with-python/index.html", root), "utf8");

  assert.match(agent, /class="notice-box notice-content"/);
  assert.match(agent, /class="table-scroll"/);
  assert.match(agent, /class="footnotes"/);
  assert.match(agent, /class="article-toc"/);
  assert.match(agent, /class="breadcrumb"/);
  assert.match(agent, /class="article-pagination"/);
  assert.match(agent, /上一篇文章/);
  assert.match(agent, /下一篇文章/);
  assert.match(agent, /href="\/writings\/deploy-an-agent-with-python\/"/);
  assert.match(agent, /href="\/writings\/codex-desktop-reconnecting-problem\/"/);
  assert.match(appStore, /class="image-loop"/);
  assert.match(appStore, /<mark>/);
  assert.match(deploy, /<details>/);
  assert.match(deploy, /<summary>查看完整代码<\/summary>/);
  assert.doesNotMatch(agent, /class="article-description"/);
  assert.match(agent, /class="article-author">黄国政<\/span>/);
  assert.match(agent, /class="article-tags"/);
  assert.match(agent, /<li>Agent<\/li>/);
  assert.match(agent, /src="\/code-blocks\.js"/);
});

test("正文英数与中文正文、引用分别使用对应的阅读字体", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  const writing = await readFile(new URL("writings/what-is-agent/index.html", root), "utf8");
  const prompt = await readFile(new URL("prompts/GPT-Live-Samantha/index.html", root), "utf8");
  const reading = await readFile(new URL("readings/we-have-never-been-modern/index.html", root), "utf8");
  const project = await readFile(new URL("projects/global-enthnography/index.html", root), "utf8");
  assert.match(css, /--source-han-serif:/);
  assert.match(css, /--body-reading: "Times New Roman"/);
  assert.match(css, /--body-kai: "Times New Roman"/);
  assert.match(css, /\.prose \{[\s\S]*?font-family: var\(--body-reading\)/);
  assert.match(css, /\.prose blockquote \{[\s\S]*?font-family: var\(--body-kai\)/);
  assert.doesNotMatch(css, /body\.detail-writings \{/);
  assert.match(css, /\.detail-editorial \.prose \{[\s\S]*?font-size: 15\.5px/);
  assert.match(css, /\.detail-editorial \.prose blockquote \{[\s\S]*?background: transparent/);
  assert.match(css, /\.detail-editorial \.article-pagination \{[\s\S]*?border-top: 0/);
  assert.match(css, /\.hero-intro \{[\s\S]*?font-family: var\(--source-han-serif\)/);
  assert.match(writing, /<body class="detail detail-writings detail-editorial">/);
  assert.match(prompt, /<body class="detail detail-prompts detail-editorial">/);
  assert.match(reading, /<body class="detail detail-readings detail-editorial">/);
  assert.match(project, /<body class="detail detail-projects detail-editorial">/);
  assert.doesNotMatch(prompt, /<body class="detail detail-writings">/);
  assert.doesNotMatch(writing, /class="article-description"/);
  assert.doesNotMatch(prompt, /class="article-description"/);
  assert.doesNotMatch(reading, /class="article-description"/);
  assert.doesNotMatch(project, /class="article-description"/);
  assert.match(writing, /<div class="article-main">[\s\S]*?<nav class="article-pagination"/);
  assert.match(prompt, /<div class="article-main">[\s\S]*?<nav class="article-pagination"/);
  assert.match(reading, /<div class="article-main">[\s\S]*?<nav class="article-pagination"/);
  assert.match(project, /<div class="article-main">[\s\S]*?<nav class="article-pagination"/);
  assert.doesNotMatch(writing, /class="eyebrow"/);
  assert.doesNotMatch(prompt, /class="eyebrow"/);
  assert.doesNotMatch(reading, /class="eyebrow"/);
  assert.doesNotMatch(project, /class="eyebrow"/);
});

test("首页栏目标题使用右侧延伸的水平分隔线", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.match(css, /\.section-heading \.section-kicker::after \{/);
  assert.match(css, /background: var\(--gray-alpha-400\)/);
  assert.match(css, /\.section-heading \.section-kicker \{[\s\S]*?font-size: 14px/);
  assert.match(css, /\.section-heading \.section-kicker \{[\s\S]*?font-weight: 600/);
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
  const cssWithoutPaperSurface = css.replace(
    /--paper-surface:[\s\S]*?\) 0 0 \/ 8px 8px;/,
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
  assert.doesNotMatch(cssWithoutPaperSurface, /(?:radial|linear)-gradient\(/);
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
  const html = await readFile(new URL("prompts/GPT-Live-Samantha/index.html", root), "utf8");
  assert.match(html, /class="code-toolbar"/);
  assert.match(html, /class="toolbar-left"><span class="toolbar-label">和 Samantha 的核心共识记录<\/span><\/div>/);
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
  assert.doesNotMatch(html, /<a[^>]*>1<\/a><\/sup>/);
});

test("正文目录可独立滚动并随当前章节自动高亮", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  const agent = await readFile(new URL("writings/what-is-agent/index.html", root), "utf8");
  const tocScript = await readFile(new URL("toc.js", root), "utf8");
  assert.match(css, /\.article-toc > p \{[\s\S]*?font-size: 14\.5px/);
  assert.match(css, /\.article-toc a \{[\s\S]*?font-size: 13\.5px/);
  assert.match(css, /\.article-toc \{[\s\S]*?overflow-y: auto/);
  assert.match(css, /\.article-toc \{[\s\S]*?max-height: calc\(100vh - 120px\)/);
  assert.match(css, /\.article-toc \{[\s\S]*?overscroll-behavior-y: contain/);
  assert.match(css, /\.article-toc \{[\s\S]*?scrollbar-width: none/);
  assert.match(css, /\.article-toc::-webkit-scrollbar \{ display: none; \}/);
  assert.match(css, /\.article-toc a:hover,[\s\S]*?\.article-toc a\[aria-current="location"\][\s\S]*?color: var\(--gray-1000\)/);
  assert.match(agent, /class="article-toc" aria-label="文章目录" tabindex="0"/);
  assert.match(agent, /src="\/toc\.js"/);
  assert.match(tocScript, /setAttribute\("aria-current", "location"\)/);
  assert.match(tocScript, /getBoundingClientRect\(\)\.top <= readingLine/);
  assert.match(tocScript, /window\.requestAnimationFrame\(updateActiveHeading\)/);
});

test("正文英文字母与数字使用 Times New Roman，标题和代码保持原有字体", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.match(css, /--body-reading: "Times New Roman"/);
  assert.match(css, /--body-kai: "Times New Roman"/);
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
  const writing = await readFile(new URL("writings/what-is-agent/index.html", root), "utf8");
  const project = await readFile(new URL("projects/global-enthnography/index.html", root), "utf8");
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.match(writing, /<div class="article-main">[\s\S]*?<footer class="article-footer"><a href="\/">← 回到首页<\/a><\/footer>[\s\S]*?<\/div>/);
  assert.match(project, /<div class="article-main">[\s\S]*?<footer class="article-footer"><a href="\/">← 回到首页<\/a><\/footer>[\s\S]*?<\/div>/);
  assert.doesNotMatch(writing, /回到写作|回到Prompt|回到阅读|回到项目/);
  assert.match(css, /\.article-footer \{[\s\S]*?margin: 24px 0 96px/);
});

test("普通拉丁文字统一使用 Libre Baskerville，代码保留代码字体", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.match(css, /--sans: "Libre Baskerville", Georgia/);
  assert.match(css, /--mono: "Libre Baskerville", Georgia/);
  assert.match(css, /--serif: "Libre Baskerville", Georgia/);
  assert.match(css, /--source-han-serif: "Libre Baskerville", Georgia/);
  assert.match(css, /--kai: "Libre Baskerville", Georgia/);
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
