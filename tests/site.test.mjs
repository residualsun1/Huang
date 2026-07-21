import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { hasMath, renderMarkdown } from "../scripts/markdown.mjs";

const root = new URL("../dist/client/", import.meta.url);

test("首页按项目、Prompt、写作、阅读顺序展示四个栏目", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.match(html, /class="site-header"/);
  assert.match(html, /class="brand-mark" aria-hidden="true">Huang/);
  assert.doesNotMatch(html, /class="site-nav"/);
  assert.doesNotMatch(html, /class="home-toc"/);
  assert.match(html, /class="portrait-space"/);
  assert.match(html, /src="https:\/\/cdn\.jsdelivr\.net\/gh\/residualsun1\/blog-static\/about\/gz\.jpg"/);
  assert.match(html, /alt="Huang 在湖边的个人照片"/);
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
  assert.match(html, /你好，我是 Huang。我在探索 AI 与人文结合的可能性/);
  assert.doesNotMatch(html, /<h1 id="home-title">AI 学习与理解<\/h1>/);
  assert.match(html, /海外 AI 产品和概念的区分与关系梳理/);

  const writingSection = html.match(/<section class="content-section" id="writings"[\s\S]*?<\/section>/)?.[0] ?? "";
  const promptSection = html.match(/<section class="content-section" id="prompts"[\s\S]*?<\/section>/)?.[0] ?? "";
  const readingSection = html.match(/<section class="content-section" id="readings"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.ok(html.indexOf('id="projects"') < html.indexOf('id="prompts"'));
  assert.ok(html.indexOf('id="prompts"') < html.indexOf('id="writings"'));
  assert.ok(html.indexOf('id="writings"') < html.indexOf('id="readings"'));
  assert.equal((writingSection.match(/class="writing-row"/g) ?? []).length, 5);
  assert.equal((promptSection.match(/class="writing-row"/g) ?? []).length, 1);
  assert.equal((readingSection.match(/class="writing-row"/g) ?? []).length, 1);
  assert.match(promptSection, /让 AI 同时以解释者、质疑者和实践者的视角/);
  assert.equal((promptSection.match(/<\/strong>\s*<span>/g) ?? []).length, 1);
  assert.equal((writingSection.match(/<\/strong>\s*<span>/g) ?? []).length, 5);
  assert.equal((readingSection.match(/<\/strong>\s*<span>/g) ?? []).length, 1);
  assert.match(writingSection, /href="\/writings\/">所有文章/);
  assert.match(promptSection, /href="\/prompts\/">所有文章/);
  assert.match(readingSection, /href="\/readings\/">所有文章/);
});

test("写作、Prompt 和阅读归档页可访问", async () => {
  const writings = await readFile(new URL("writings/index.html", root), "utf8");
  const prompts = await readFile(new URL("prompts/index.html", root), "utf8");
  const readings = await readFile(new URL("readings/index.html", root), "utf8");

  assert.match(writings, /class="collection-shell"/);
  assert.match(writings, /<h1>写作<\/h1>/);
  assert.ok((writings.match(/class="writing-row"/g) ?? []).length >= 5);
  assert.match(prompts, /02 \/ Prompt/);
  assert.match(prompts, /<h1>Prompt<\/h1>/);
  assert.match(prompts, /three-perspective-reading/);
  assert.match(readings, /<h1>阅读<\/h1>/);
  assert.match(readings, /we-have-never-been-modern/);
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

test("正文和引用使用独立的中文阅读字体", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  const writing = await readFile(new URL("writings/what-is-agent/index.html", root), "utf8");
  const prompt = await readFile(new URL("prompts/three-perspective-reading/index.html", root), "utf8");
  const reading = await readFile(new URL("readings/we-have-never-been-modern/index.html", root), "utf8");
  assert.match(css, /--source-han-serif:/);
  assert.match(css, /--kai:/);
  assert.match(css, /\.prose \{[\s\S]*?font-family: var\(--source-han-serif\)/);
  assert.match(css, /\.prose blockquote \{[\s\S]*?font-family: var\(--kai\)/);
  assert.doesNotMatch(css, /body\.detail-writings \{/);
  assert.match(css, /\.detail-editorial \.prose \{[\s\S]*?font-size: 15\.5px/);
  assert.match(css, /\.detail-editorial \.prose blockquote \{[\s\S]*?background: transparent/);
  assert.match(css, /\.detail-editorial \.article-pagination \{[\s\S]*?border-top: 0/);
  assert.match(css, /\.hero-intro \{[\s\S]*?font-family: var\(--source-han-serif\)/);
  assert.match(writing, /<body class="detail detail-writings detail-editorial">/);
  assert.match(prompt, /<body class="detail detail-prompts detail-editorial">/);
  assert.match(reading, /<body class="detail detail-readings detail-editorial">/);
  assert.doesNotMatch(prompt, /<body class="detail detail-writings">/);
  assert.doesNotMatch(writing, /class="article-description"/);
  assert.doesNotMatch(prompt, /class="article-description"/);
  assert.doesNotMatch(reading, /class="article-description"/);
  assert.match(writing, /<div class="article-main">[\s\S]*?<nav class="article-pagination"/);
  assert.match(prompt, /<div class="article-main">[\s\S]*?<nav class="article-pagination"/);
  assert.match(reading, /<div class="article-main">[\s\S]*?<nav class="article-pagination"/);
  assert.doesNotMatch(writing, /class="eyebrow"/);
  assert.doesNotMatch(prompt, /class="eyebrow"/);
  assert.doesNotMatch(reading, /class="eyebrow"/);
});

test("首页栏目标题使用右侧延伸的水平分隔线", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.match(css, /\.section-heading \.section-kicker::after \{/);
  assert.match(css, /background: var\(--gray-alpha-400\)/);
  assert.match(css, /\.section-heading \.section-kicker \{[\s\S]*?font-size: 14px/);
  assert.match(css, /\.section-heading \.section-kicker \{[\s\S]*?font-weight: 600/);
});

test("首页使用 880px 中等宽度与更舒展的照片位", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.match(css, /\.home-layout \{[\s\S]*?padding-bottom: 112px/);
  assert.match(css, /\.home-layout \{[\s\S]*?width: min\(calc\(100% - 48px\), 880px\)/);
  assert.match(css, /\.hero \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) 260px/);
  assert.match(css, /\.hero \{[\s\S]*?gap: 40px/);
  assert.match(css, /\.portrait-space \{[\s\S]*?height: 190px/);
  assert.match(css, /\.portrait-space \{[\s\S]*?overflow: hidden/);
  assert.match(css, /\.portrait-space img \{[\s\S]*?object-position: 76% center/);
  assert.doesNotMatch(css, /\.home-toc/);
});

test("所有写作页面均不残留已知 Hugo 短代码", async () => {
  const writingRoot = new URL("writings/", root);
  const directories = await readdir(writingRoot, { withFileTypes: true });
  for (const directory of directories.filter((entry) => entry.isDirectory())) {
    const html = await readFile(new URL(`${directory.name}/index.html`, writingRoot), "utf8");
    assert.doesNotMatch(html, /\{\{[%<]\s*(?:notice|imgloop)/i, directory.name);
  }
});

test("Prompt 代码块包含语言类并被安全转义", async () => {
  const html = await readFile(new URL("prompts/three-perspective-reading/index.html", root), "utf8");
  assert.match(html, /class="code-toolbar"/);
  assert.match(html, /class="toolbar-left"><span class="toolbar-label">文本<\/span><\/div>/);
  assert.match(html, /class="toolbar-right"><button class="toolbar-btn code-copy"[^>]*>复制<\/button><\/div>/);
  assert.match(html, /<pre data-language="text"><code class="language-text">/);
  assert.match(html, /解释者/);
});

test("代码块拥有本地高亮样式、复制按钮脚本与横向滚动", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  const script = await readFile(new URL("code-blocks.js", root), "utf8");
  const shellCode = renderMarkdown("```bash\nif true; then echo \'ok\'; fi\n```").html;
  const shellUrl = renderMarkdown("```bash\ncurl https://example.com/api\n```").html;
  const filenameCode = renderMarkdown('```python label="app.py"\nprint("hello")\n```').html;
  const escapedLabel = renderMarkdown('```javascript title="<script>"\nconst value = true;\n```').html;
  assert.match(css, /\.prose pre \{[\s\S]*?overflow: auto/);
  assert.match(css, /--code-font:/);
  assert.match(css, /\.prose pre \{[\s\S]*?background: #efebe4/);
  assert.match(css, /\.prose pre \{[\s\S]*?font-family: var\(--code-font\)/);
  assert.match(css, /\.prose pre code \{[\s\S]*?font-family: inherit/);
  assert.match(css, /\.code-block \{[\s\S]*?box-shadow:/);
  assert.match(css, /\.code-toolbar \{/);
  assert.match(css, /\.token-keyword/);
  assert.match(script, /navigator\.clipboard/);
  assert.match(script, /querySelector\("\.code-copy"\)/);
  assert.match(filenameCode, /class="toolbar-label">app\.py<\/span>/);
  assert.match(filenameCode, /class="language-python"/);
  assert.match(escapedLabel, /class="toolbar-label">&lt;script&gt;<\/span>/);
  assert.doesNotMatch(filenameCode, /toolbar-dot|view-toggle|lang-inline-toggle/);
  assert.match(shellCode, /token-keyword">if<\/span>/);
  assert.match(shellCode, /token-string">&#039;ok&#039;<\/span>/);
  assert.doesNotMatch(shellUrl, /token-comment/);
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
  assert.match(css, /\.writing-row \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) 112px 32px/);
  assert.match(css, /--title-serif: "Libre Baskerville"/);
  assert.match(css, /\.home \.writing-copy strong \{[\s\S]*?color: rgb\(139, 69, 19\)/);
  assert.match(css, /\.home \.writing-copy strong \{[\s\S]*?font-size: 16px/);
  assert.match(css, /\.home \.writing-copy strong \{[\s\S]*?font-weight: 700/);
  assert.match(css, /\.home \.writing-copy strong:hover \{ text-decoration-color: rgb\(139, 69, 19\); \}/);
  assert.match(css, /\.home \.writing-row:hover \{ background: transparent; \}/);
  assert.match(css, /\.home \.writing-copy > span \{[\s\S]*?color: rgb\(136, 136, 136\)/);
  assert.match(css, /\.home \.writing-copy > span \{[\s\S]*?font-size: 14\.4px/);
  assert.match(css, /\.home \.writing-copy > span \{[\s\S]*?line-height: 24\.48px/);
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

test("页眉页脚无分隔线且页脚显示邮箱", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  const html = await readFile(new URL("index.html", root), "utf8");
  const headerRule = css.match(/\.site-header \{([\s\S]*?)\}/)?.[1] ?? "";
  assert.doesNotMatch(headerRule, /border-bottom/);
  assert.doesNotMatch(css, /\.site-footer \{[\s\S]*?border-top/);
  assert.match(html, /class="footer-email" href="mailto:Residualsun@proton\.me">Residualsun@proton\.me<\/a>/);
  assert.doesNotMatch(html, /持续学习，持续修订/);
  assert.match(css, /\.footer-email \{[\s\S]*?font-family: var\(--title-serif\)/);
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
