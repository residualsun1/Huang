# UI 调整文件指南

本项目没有使用 React、Vue 或 CSS 框架。页面由构建脚本生成，所有视觉样式集中维护。

## 应该修改的源文件

| 文件 | 负责内容 | 常见调整 |
| --- | --- | --- |
| `public/styles.css` | 全站 CSS 样式 | 背景色、字体、字号、宽度、间距、卡片、文章排版、响应式布局 |
| `scripts/build.mjs` | HTML 页面结构和组件模板 | 调整导航栏目、增加区块、改变卡片或文章页面的 DOM 结构 |
| `scripts/markdown.mjs` | Markdown 转 HTML | 多级列表、代码高亮、Hugo 短代码与其他文章格式 |
| `public/code-blocks.js` | 正文代码块交互 | 复制按钮及本地 HTTP 兼容逻辑 |
| `public/scene.js` | 已暂停加载的首页像素场景 | 仅在未来恢复像素场景时继续调整 |
| `public/images/` | 历史首页场景、Codey、社交分享图等图片 | 替换图片素材 |
| `docs/DESIGN-SYSTEM.md` | 当前视觉规范 | 查看颜色、字体和布局原则，不直接影响页面显示 |

## 不要直接修改的文件

`dist/` 是运行 `npm run build` 后自动生成的输出目录。`dist/client/styles.css` 虽然可以打开，
但下一次构建时会被 `public/styles.css` 覆盖，因此不要在这里做长期修改。

## CSS 中最常调整的位置

1. 修改全站背景色：搜索 `--background-100`。
2. 修改全站最大宽度：搜索 `--page-width`。
3. 修改文章正文宽度：搜索 `--article-width`。
4. 修改首页简介：搜索 `.hero-intro`。
5. 修改项目卡片：搜索 `.project-grid` 和 `.project-card`。
6. 修改首页同一栏目内的文章间距：搜索 `.home .writing-row`，调整 `padding-block`。
7. 修改文章正文：搜索 `.prose`。
8. 修改写作、提示词与阅读的统一正文排版：搜索 `.detail-editorial .prose`；其中 `margin-top` 控制正文与标题区底部分隔线的距离。
9. 修改引用：搜索 `.prose blockquote`。
10. 修改代码块：搜索 `.code-block`、`.prose pre` 和 `.token-`。
11. 修改文章作者和标签：搜索 `.article-byline` 和 `.article-tags`。
12. 修改写作页上一篇/下一篇卡片：搜索 `.detail-writings .article-pagination` 和 `.article-pagination-item`。
13. 修改手机样式：搜索 `@media (max-width: 600px)`。

## 修改后的预览方法

在 VS Code 终端中运行：

```powershell
npm run dev
```

然后打开终端显示的本地地址。修改 `public/styles.css` 后重新刷新浏览器即可查看效果。
若提示 `EADDRINUSE`，说明预览端口已被另一个进程占用，需要关闭旧的预览进程后再运行。
