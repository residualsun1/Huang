# Residualsun

个人网站，正式地址为 [guozheng.dev](https://guozheng.dev)。页面移自 `D:\03_Project\Website`，继续使用 Huang 原来的零依赖静态构建、Markdown 内容、Git 历史及 Cloudflare 发布流程。

现在 `D:\03_Project\Huang` 是后续写作与维护的唯一正式项目。页面、文章和资源均在此目录内，不依赖 Website 文件夹；不要编辑 `dist/` 里的生成文件。

## 本地写作

需要 Node.js 24。首次使用：

```powershell
npm ci
npm run hooks:install
npm run dev
```

预览默认在 `http://127.0.0.1:4173`。修改 Markdown 或 `public/` 资源后自动重新构建，刷新浏览器即可查看。修改 `scripts/` 模板后重启预览。

文章继续放在 `content/writings/`、`content/projects/`、`content/readings/`，支持年份子目录，例如 `content/writings/2026/example.md`：

```md
---
title: 文章标题
description: 一句话摘要
author: 作者名称
date: 2026-10-03
slug: example
tags:
  - 写作
cover: /images/example.webp
coverAlt: 图片内容的简要说明
---

这里写 Markdown 正文。
```

`title`、`date` 必填；其余字段按需填写。`slug` 决定固定文章网址，已发布文章请保持其值。省略时使用文件名。首页自动读取标题、摘要、日期、标签与封面；标签侧栏自动汇总所有文章。原有文章的 URL、正文及真实修改日期/次数保留。

封面文件放在 `public/images/`。支持 JPG、PNG、WebP 和 GIF，动态 WebP/GIF 直接显示原文件。未填写 `cover` 时，已有文章使用 `scripts/covers.mjs` 中的生成封面；新文章没有映射时显示文字卡片。首页两张默认封面保持轻缓漂移。

## 发布

```powershell
npm test
git add <本次修改的文件>
git commit -m "更新文章"
git push origin main
```

推送 `main` 后，现有 Cloudflare Pages 自动检查并发布到 guozheng.dev。构建命令仍为 `npm test`，输出目录仍为 `dist/client`，无需更换托管或域名。正式环境 `SITE_URL=https://guozheng.dev`；预览环境可使用平台的 `CF_PAGES_URL`。Git pre-push hook 会在普通推送前再运行检查。

## 维护位置

- `content/`：Markdown 正文，原文件保留。
- `scripts/build.mjs`：内容读取、Git 历史、静态产物、robots 与 sitemap。
- `scripts/homepage.mjs`、`public/homepage.js`：首页模板、分类/标签筛选与展开。
- `scripts/template.mjs`：阅读页、归档、404 模板。
- `scripts/markdown.mjs`：原 Markdown 转换器及兼容能力。
- `scripts/frontmatter.mjs`、`scripts/assets.mjs`：元数据解析与资源版本。
- `public/homepage.css`：首页排版、英文 Cormorant Garamond 与局部动效。
- `public/site-chrome.css`：共用页头、Libre Baskerville 字标与 240ms 页面淡化。
- `public/reader.css`、`public/styles.css`：阅读页适配和原正文样式。
- `public/fonts/`、`public/images/`、`public/icons/`：本地字体、头像、封面和社交图标。
- `tests/`：内容格式、资源、链接、交互约定及构建回归。

分类/标签结果淡入 200ms；展开只让新增卡片浮现 280ms、上移 6px。首次内容和正文直接可见，新增动效遵守减少动态偏好，不支持原生跨页过渡的浏览器正常跳转。

迁移、验证及回滚说明见 [迁移记录](docs/RESIDUALSUN-MIGRATION.md)。原部署文档见 [DEPLOYMENT.md](docs/DEPLOYMENT.md)。
