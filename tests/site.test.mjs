import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { renderMarkdown } from "../scripts/markdown.mjs";

const root = new URL("../dist/client/", import.meta.url);

test("首页包含三个最小内容栏目和用户文章", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.match(html, /class="site-header"/);
  assert.match(html, /01 \/ PROJECT/);
  assert.match(html, /02 \/ WRITING/);
  assert.match(html, /03 \/ PROMPT/);
  assert.match(html, /class="project-card"/);
  assert.match(html, /class="writing-row"/);
  assert.match(html, /class="prompt-card"/);
  assert.match(html, /\/images\/ai-companion-scene-v2\.png/);
  assert.match(html, /class="scene-frame"/);
  assert.match(html, /class="scene-particles"/);
  assert.match(html, /class="codex-pet"/);
  assert.match(html, /Who is out there\?/);
  assert.doesNotMatch(html, /<h1 id="home-title">AI 学习与理解<\/h1>/);
  assert.match(html, /海外 AI 产品和概念的区分与关系梳理/);
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
  assert.match(appStore, /class="image-loop"/);
  assert.match(appStore, /<mark>/);
  assert.match(deploy, /<details>/);
  assert.match(deploy, /<summary>查看完整代码<\/summary>/);
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
