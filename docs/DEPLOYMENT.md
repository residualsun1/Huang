# 部署上线规划

## 1. 当前架构

“架构”是项目各部分的职责划分、依赖方向和协作方式。本站采用自建静态站点生成器：

```text
content/*.md
    ↓ scripts/markdown.mjs
结构化文章 HTML
    ↓ scripts/build.mjs + public/*
dist/client/*
    ↓ GitHub + Cloudflare Pages
公开网站
```

各层边界如下：

| 层 | 文件 | 职责 |
| --- | --- | --- |
| 内容层 | `content/` | 文章、项目和 Front Matter 数据 |
| 转换层 | `scripts/markdown.mjs` | Markdown、代码块和旧 Hugo 格式转换 |
| 页面层 | `scripts/build.mjs` | 页面模板、归档、分页、SEO 文件 |
| 展示层 | `public/styles.css`、`public/*.js` | 视觉和少量浏览器交互 |
| 验证层 | `tests/site.test.mjs` | 防止构建与主要页面行为回归 |
| 产物层 | `dist/client/` | 只供托管平台发布，不手工修改、不提交 Git |

这套架构不需要 React、Vue、数据库或服务端运行时。访问者拿到的是普通 HTML、CSS、JavaScript 和图片，故障面小、迁移成本低。

## 2. CSS 是否需要拆分

`public/styles.css` 约 47 KB，压缩传输约 12–15 KB。它的行数不会直接降低浏览器性能；对这个规模的网站，拆成多个在线请求也不会让页面更快。

当前 CSS 已按“变量与基础样式 → 全站容器 → 首页 → 归档 → 正文与 Markdown → 响应式”排列并带有段落注释，因此上线前保留单文件更易理解。继续增长到约 2,500–3,000 行、多人同时修改，或同一组件出现大量跨区覆盖时，再把**源文件**拆成 `tokens.css`、`layout.css`、`components.css`、`content.css`，构建时合并为一个发布文件。不要仅为了行数拆分。

## 3. 推荐平台

首选 **Cloudflare Pages**。

原因：

- 当前项目是纯静态站点，正好匹配 Pages 的核心能力，无需为框架运行时付出额外复杂度。
- GitHub 推送、Pull Request 预览、生产分支和回滚流程完整。
- 免费层对个人静态内容站较宽裕，且静态请求与带宽规则比按混合积分计费更容易理解。
- 自定义域名、HTTPS、全球 CDN、安全响应头和未来接入 Cloudflare DNS 可以在同一处管理。

备选：

- **Vercel**：开发体验优秀，尤其适合 Next.js；本站不使用 Next.js，因此其框架优势用不上。
- **Netlify**：静态站托管成熟、操作直观；新版免费方案采用综合 credits，对长期内容站的用量估算不如 Cloudflare 直观。
- **GitHub Pages**：也能托管本站，但缺少同等顺手的分支预览和边缘平台扩展能力，作为极简备用方案更合适。

## 4. 首次上线

### 4.1 建立 GitHub 远端

先在 GitHub 创建一个空仓库，不要勾选自动生成 README、`.gitignore` 或 License。然后在本地项目根目录运行：

```powershell
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

当前仓库没有配置远端，因此这一步不会覆盖既有远端。

### 4.2 连接 Cloudflare Pages

在 Cloudflare Dashboard 中进入 Workers & Pages，选择 Pages 并连接该 GitHub 仓库：

| 配置项 | 值 |
| --- | --- |
| Production branch | `main` |
| Build command | `npm test` |
| Build output directory | `dist/client` |
| Root directory | 留空 |
| Node.js | 由 `.node-version` 自动指定为 24 |

`npm test` 会先生成站点，再运行全部自动测试；任何测试失败都会阻止错误版本上线。

首次构建时 Cloudflare 会提供 `*.pages.dev` 地址，并自动注入 `CF_PAGES_URL`。生成器会用它创建 canonical、Open Graph 图片绝对地址、`robots.txt` 和 `sitemap.xml`。

绑定正式域名后，在 Pages 的生产环境变量中增加：

```text
SITE_URL=https://你的正式域名
```

不要在末尾加 `/`。重新部署后，正式域名会替代 `pages.dev` 成为 canonical 地址。

### 4.3 验收清单

- 首页、四个归档页、至少一篇长文章和 404 页面正常。
- 手机与桌面端没有横向溢出；目录、复制按钮和数学公式正常。
- 浏览器控制台无 404 或脚本错误。
- `https://正式域名/robots.txt` 与 `/sitemap.xml` 可访问。
- 分享链接能显示 `og.png`。
- GitHub 上的 Site checks 与 Cloudflare 部署均为成功状态。
- 自定义域名 HTTPS 正常，裸域名与 `www` 只保留一个主地址。

## 5. 日常修改与发布

Codex 和 VS Code 修改的是同一套本地文件，不会产生两套网站。建议保持以下流程：

```text
新建 feat/* 或 fix/* 分支
→ Codex 或 VS Code 修改
→ npm test
→ commit + push
→ Cloudflare 自动生成预览地址
→ GitHub Pull Request 检查
→ 合并 main
→ 自动发布生产站
```

文章小修也可以直接在 `main` 提交，但分支与 Pull Request 能提供更安全的预览和回滚点。

## 6. OpenAI Sites 与个人托管的关系

`.openai/hosting.json` 只记录现有 Sites 预览项目的标识，不含 GitHub 或 Cloudflare 凭据，也不会拦截 Git 推送。Sites 使用 `dist/` 中自己的包装信息；Cloudflare 只发布 `dist/client/`，二者互不覆盖。

上线 Cloudflare 后可以继续保留该文件用于 Codex 内预览。若以后确定不再使用 Sites，再单独移除 `.openai/hosting.json` 及 `scripts/build.mjs` 中对应的复制步骤；不要在正式迁移前删除，以免失去现有预览通道。

## 7. 已知边界

- Markdown 转换器默认内容来自仓库所有者，允许部分原始 HTML。它不适合直接接收匿名用户投稿；未来接入 CMS 或开放投稿时必须增加 HTML 白名单清洗。
- Google Fonts、jsDelivr 上的 Geist Mono 与 KaTeX、以及文章中的部分外部图标仍是第三方网络资源。当前均有字体回退或按需加载，不影响主体 HTML；若要做到完全自主和离线可用，再将这些资源自托管并补充许可证记录。
- 图片目前按原文件复制，只有社交分享图做了人工压缩。文章图片增多后再加入构建期尺寸检查和压缩，不必提前引入重型图片管线。
- 自建 Markdown 解析器保留了旧 Hugo 内容兼容能力，也意味着格式扩展必须同步补测试。当前测试覆盖充分，不建议仅为了“使用框架”而迁移。

## 8. 后续维护节奏

- 每次发布：运行 `npm test`，检查 Git diff，再推送。
- 每月：抽查外部字体、KaTeX CDN 和文章外链。
- 每季度：检查 Node LTS、Cloudflare 构建日志、404、搜索收录和图片体积。
- 每年：升级 Node 主版本时同步更新 `.node-version`、`package.json` 和 CI，并完整回归测试。
- 内容显著增多后：考虑构建期图片压缩、RSS、按内容更新时间生成 sitemap，以及将 CSS 源码模块化后合并发布。
