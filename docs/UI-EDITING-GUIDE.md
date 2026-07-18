# UI 调整文件指南

本项目没有使用 React、Vue 或 CSS 框架。页面由构建脚本生成，所有视觉样式集中维护。

## 应该修改的源文件

| 文件 | 负责内容 | 常见调整 |
| --- | --- | --- |
| `public/styles.css` | 全站 CSS 样式 | 背景色、字体、字号、宽度、间距、卡片、文章排版、响应式布局 |
| `scripts/build.mjs` | HTML 页面结构和组件模板 | 调整导航栏目、增加区块、改变卡片或文章页面的 DOM 结构 |
| `public/scene.js` | 首页像素场景交互 | 粒子数量、Hover 反应、点击震动、Codey 移动距离 |
| `public/images/` | 首页场景、Codey、社交分享图等图片 | 替换图片素材 |
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
6. 修改写作列表：搜索 `.writing-row`。
7. 修改文章正文：搜索 `.prose`。
8. 修改写作页正文：搜索 `.detail-writings .prose`。
9. 修改引用：搜索 `.prose blockquote`。
10. 修改手机样式：搜索 `@media (max-width: 600px)`。

## 修改后的预览方法

在 VS Code 终端中运行：

```powershell
npm run dev
```

然后打开终端显示的本地地址。修改 `public/styles.css` 后重新刷新浏览器即可查看效果。
若提示 `EADDRINUSE`，说明预览端口已被另一个进程占用，需要关闭旧的预览进程后再运行。

