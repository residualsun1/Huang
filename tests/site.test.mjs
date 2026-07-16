import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { renderMarkdown } from "../scripts/markdown.mjs";

const root = new URL("../dist/client/", import.meta.url);

test("首页包含三个最小内容栏目和用户文章", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.match(html, /class="site-header"/);
  assert.match(html, /class="brand-mark" aria-hidden="true">Huang/);
  assert.match(html, /01 \/ PROJECT/);
  assert.match(html, /02 \/ WRITING/);
  assert.match(html, /03 \/ PROMPT/);
  assert.match(html, /class="project-card"/);
  assert.match(html, /class="writing-row"/);
  assert.doesNotMatch(html, /class="prompt-card"/);
  assert.match(html, /\/images\/ai-companion-scene-v3\.png/);
  assert.match(html, /class="scene-frame"/);
  assert.match(html, /class="scene-particles"/);
  assert.match(html, /class="codex-pet"/);
  assert.match(html, /class="pet-sprite" src="\/images\/codey-head-v1\.png"/);
  assert.doesNotMatch(html, /class="pet-body"/);
  assert.match(html, /你好，我是 Huang。我在探索 AI、人文、艺术/);
  assert.doesNotMatch(html, /<h1 id="home-title">AI 学习与理解<\/h1>/);
  assert.match(html, /海外 AI 产品和概念的区分与关系梳理/);

  const writingSection = html.match(/<section class="content-section" id="writings"[\s\S]*?<\/section>/)?.[0] ?? "";
  const promptSection = html.match(/<section class="content-section" id="prompts"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.equal((writingSection.match(/class="writing-row"/g) ?? []).length, 5);
  assert.equal((promptSection.match(/class="writing-row"/g) ?? []).length, 1);
  assert.match(writingSection, /href="\/writings\/">所有文章/);
  assert.match(promptSection, /href="\/prompts\/">所有文章/);
});

test("写作和提示词归档页可访问全部条目", async () => {
  const writings = await readFile(new URL("writings/index.html", root), "utf8");
  const prompts = await readFile(new URL("prompts/index.html", root), "utf8");

  assert.match(writings, /class="collection-shell"/);
  assert.match(writings, /<h1>写作<\/h1>/);
  assert.ok((writings.match(/class="writing-row"/g) ?? []).length >= 5);
  assert.match(prompts, /<h1>提示词<\/h1>/);
  assert.match(prompts, /three-perspective-reading/);
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
});

test("正文和引用使用独立的中文阅读字体", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  const writing = await readFile(new URL("writings/what-is-agent/index.html", root), "utf8");
  const prompt = await readFile(new URL("prompts/three-perspective-reading/index.html", root), "utf8");
  assert.match(css, /--source-han-serif:/);
  assert.match(css, /--kai:/);
  assert.match(css, /\.prose \{[\s\S]*?font-family: var\(--source-han-serif\)/);
  assert.match(css, /\.prose blockquote \{[\s\S]*?font-family: var\(--kai\)/);
  assert.match(css, /body\.detail-writings \{/);
  assert.match(css, /\.detail-writings \.prose > p \{[\s\S]*?text-indent: 2em/);
  assert.match(css, /\.detail-writings \.article-pagination-item \{/);
  assert.match(writing, /<body class="detail detail-writings">/);
  assert.match(prompt, /<body class="detail detail-prompts">/);
  assert.doesNotMatch(prompt, /<body class="detail detail-writings">/);
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
  assert.match(html, /<pre><code class="language-text">/);
  assert.match(html, /解释者/);
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
