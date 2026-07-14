import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../dist/client/", import.meta.url);

test("首页包含三个最小内容栏目", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.match(html, /01<\/span> 项目/);
  assert.match(html, /02<\/span> 写作/);
  assert.match(html, /03<\/span> 提示词/);
  assert.match(html, /个人 AI 学习网站/);
});

test("Markdown 内容生成独立详情页", async () => {
  const html = await readFile(new URL("writings/start-from-a-clear-question/index.html", root), "utf8");
  assert.match(html, /先形成自己的问题，再寻找工具/);
  assert.match(html, /<h2>问题比工具更稳定<\/h2>/);
  assert.match(html, /<ol>/);
});

test("Prompt 代码块被安全渲染", async () => {
  const html = await readFile(new URL("prompts/three-perspective-reading/index.html", root), "utf8");
  assert.match(html, /<pre><code>/);
  assert.match(html, /解释者/);
});
