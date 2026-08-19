# Huang 的 AI 学习与思考

一个零运行时依赖、Markdown 驱动的中文个人网站。内容在构建阶段生成静态 HTML，适合长期写作、项目展示和求职作品集。

## 本地使用

需要 Node.js 24。项目根目录的 `.node-version` 与 `package.json` 已固定运行时主版本。

```powershell
npm ci
npm run hooks:install
npm run dev
```

`npm run hooks:install` 只需在每个本地克隆中运行一次；它会让普通的 `git push` 在上传前自动执行完整检查。浏览器访问终端显示的本地地址。也可以随时手动检查：

```powershell
npm test
```

`npm run build` 会将可部署文件生成到 `dist/client/`。不要直接修改 `dist/`，它会在下次构建时被覆盖。

## 添加内容

在以下任一目录中新增 `.md` 文件：

- `content/projects/`
- `content/writings/`
- `content/readings/`

栏目目录支持按年份继续分层，例如：

```text
content/
└── writings/
    ├── 2026/
    │   └── example.md
    └── 2027/
        └── another-article.md
```

每篇内容至少需要 `title` 和 `date`：

```md
---
title: 标题
description: 一句话摘要
date: 2026-07-14
---
```

文件名默认成为网址的一部分。无论文章位于 `content/writings/example.md` 还是 `content/writings/2026/example.md`，都会生成 `/writings/example/`；也可以通过 Front Matter 的 `slug` 自定义网址。

首页按照“项目 → 写作 → 阅读”排列，每个栏目展示最新三项。社交链接集中定义在 `scripts/build.mjs` 顶部的 `socialLinks`。

## 项目结构

```text
content/             Markdown 内容
public/              浏览器直接加载的 CSS、脚本和图片
scripts/build.mjs    页面模板、内容读取和静态站点构建
scripts/markdown.mjs Markdown 与旧 Hugo 格式转换
scripts/dev.mjs      本地预览与自动重建
tests/               构建结果和 Markdown 转换测试
docs/                维护、内容兼容和部署文档
dist/client/         自动生成的部署产物（不提交 Git）
```

详细部署方案与 Git 工作流见 [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)。内容迁移格式见 [`docs/CONTENT-COMPATIBILITY.md`](docs/CONTENT-COMPATIBILITY.md)，视觉规范见 [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md)。
