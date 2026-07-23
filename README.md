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
- `content/readings/`

栏目目录支持继续按年份建立子文件夹，例如：

```text
content/
└─ writings/
   ├─ 2026/
   │  └─ example.md
   └─ 2027/
      └─ another-article.md
```

生成器会递归读取所有层级中的 `.md` 文件；尚未迁移进年份文件夹的文章也可以继续保留在栏目根目录。

每篇内容使用相同的头部字段：

```md
---
title: 标题
description: 一句话摘要
date: 2026-07-14
---
```

文件名会成为网址的一部分。无论文件位于 `content/writings/example.md`，还是
`content/writings/2026/example.md`，都会生成 `/writings/example/`；年份目录只负责文件管理，
不会进入公开网址。也可以继续通过 Front Matter 中的 `slug` 自定义网址。

首页按“项目 → 提示词 → 写作 → 阅读”排列，每个栏目最多展示最新 3 项；
阅读内容放入 `content/readings/` 后会自动出现在首页和 `/readings/` 归档页。

首页 X 与 GitHub 地址集中定义在 `scripts/build.mjs` 顶部的 `socialLinks` 对象中，
将其中的平台首页地址替换为自己的个人主页即可。

从 Hugo 迁移文章、可用扩展格式和未知格式的处理方式，见
[`docs/CONTENT-COMPATIBILITY.md`](docs/CONTENT-COMPATIBILITY.md)。

站点的 Warm Geist 视觉原则和设计 Token，见
[`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md)。
