# AI 学习与理解 · Demo

一个零依赖、Markdown 驱动的中文个人网站 Demo。

## 使用

```bash
npm run dev
```

浏览器访问终端显示的本地地址。生成可部署文件：

```bash
npm run build
```

## 添加内容

在以下任一目录新增 `.md` 文件：

- `content/projects/`
- `content/writings/`
- `content/prompts/`

每篇内容使用相同的头部字段：

```md
---
title: 标题
description: 一句话摘要
date: 2026-07-14
---
```

文件名会成为网址的一部分，例如 `content/writings/example.md` 会生成
`/writings/example/`。

从 Hugo 迁移文章、可用扩展格式和未知格式的处理方式，见
[`docs/CONTENT-COMPATIBILITY.md`](docs/CONTENT-COMPATIBILITY.md)。

站点的 Warm Geist 视觉原则和设计 Token，见
[`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md)。
