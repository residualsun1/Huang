# Huang 站点视觉外观完整备份与恢复手册

> 这是一份“可以拿来恢复当前外观”的设计备份，也是给初级开发者使用的颜色与材质说明书。  
> 它记录的是 **2026-07-24 当前版本**，不是未来永远不变的设计建议。

## 1. 备份基准与使用方法

| 项目 | 当前基准 |
| --- | --- |
| 视觉样式源文件 | `public/styles.css` |
| 记录时间 | 2026-07-24（Asia/Shanghai） |
| Git 基准提交 | `33afb225bbbb12fdcaa84735444848216f264e68` |
| `public/styles.css` 文件大小 | `43426` bytes |
| `public/styles.css` SHA-256 | `f33abfd4169a5e37383264ff0e3f9a3a49b2daec2d29edd76e928cf55f23fe28` |
| 当前视觉方向 | 轻暖羊皮纸、均匀纸粒、斜向细纹、低饱和编辑风格 |

SHA-256 可以理解为文件的“数字指纹”。以后如果 `public/styles.css` 的 SHA-256 与上表不同，
说明样式文件已经发生变化。文件变化不一定是坏事，但表示它不再与本备份完全相同。

恢复时优先使用本文件记录的 CSS 变量和组件参数。不要直接修改 `dist/client/styles.css`：
`dist/` 是构建产物，下一次运行 `npm run build` 时会被重新生成。

## 2. 初学者需要先理解的术语

| 术语 | 通俗解释 | 修改后通常影响什么 |
| --- | --- | --- |
| `background` | 元素背后的颜色或图案 | 页面底色、卡片底色、代码块底色 |
| `color` | 文字和使用 `currentColor` 的 SVG 图标颜色 | 标题、正文、图标、链接 |
| `border` | 元素边缘的线 | 卡片轮廓、代码块边缘、分隔线 |
| `box-shadow` | 元素外部或内部的阴影 | 纸张厚度、悬浮层次、键盘焦点环 |
| `opacity` | 整个元素的透明度，`1` 为完全不透明 | 禁用链接、纹理强弱 |
| `rgba(r,g,b,a)` | 带透明度的颜色，最后的 `a` 为透明度 | 柔和边框、阴影、叠加层 |
| `gradient` | CSS 生成的渐变图像 | 本站用它生成纸粒和斜纹，不用于白黄大面积渐变 |
| `currentColor` | SVG 图标继承父元素的 `color` | 图标会与旁边文字同步变色 |
| CSS 变量 | 例如 `var(--background-100)` | 改一个变量，可同时改变多个组件 |
| 直接色值 | 例如 `#34312f` | 只影响写有这个值的选择器，需要逐处检查 |

## 3. 视觉样式由哪些文件负责

| 文件 | 视觉职责 | 恢复时是否重要 |
| --- | --- | --- |
| `public/styles.css` | 全站颜色、纹理、字体、边框、阴影、间距、响应式样式 | **最重要，唯一 CSS 源文件** |
| `scripts/build.mjs` | 首页、项目卡片、社交入口和文章页面的 HTML/SVG 结构 | 组件结构或图标缺失时检查 |
| `scripts/markdown.mjs` | 代码块、Prompt、React/GPT/Claude/Gemini 块的 HTML/SVG 结构 | Markdown 组件外观异常时检查 |
| `public/favicon.svg` | 浏览器标签页图标及其蓝色配色 | 只影响 favicon |
| `public/og.png` | 分享链接时使用的社交预览图 | 不影响网页页面本身 |
| `dist/client/` | 自动生成的网站文件 | 不应手动恢复或修改 |

## 4. 全站核心色板

### 4.1 页面底色与不同“表面”

“表面”是指放在网站背景上的区域，例如项目卡片、代码块、GPT 输出块。

| CSS 变量 | 当前值 | 归属对象 | 改动影响 |
| --- | --- | --- | --- |
| `--background-100` | `#f2ede3` | 全站轻暖羊皮纸底色 | 页面、固定页眉、提示框标签及焦点环底层 |
| `--background-200` | `rgba(29, 27, 27, 0.035)` | 很轻的深色叠层 | 表头、图片占位等极弱层次 |
| `--surface-raised` | `rgba(250, 247, 241, 0.8)` | 抬升纸面 | 表格、notice、details、翻页卡片、kbd |
| `--surface-code` | `#efe9df` | 代码正文纸面 | 普通代码块，也被 Prompt 复用 |
| `--surface-code-toolbar` | `#e8e1d7` | 代码块顶栏 | 普通代码块顶栏，也被 Prompt 顶栏复用 |
| `--surface-prompt` | `var(--surface-code)` | Prompt 正文背景 | 当前与代码块正文完全同步 |
| `--surface-prompt-toolbar` | `var(--surface-code-toolbar)` | Prompt 顶栏背景 | 当前与代码块顶栏完全同步 |
| `--surface-react` | `#ffffff` | React/GPT/Claude/Gemini 输出纸面 | AI 回复区域的白色高亮卡片 |
| `--surface-hover` | `rgba(250, 247, 241, 0.94)` | 抬升组件 Hover | 上一篇/下一篇卡片悬浮状态 |
| `--border-code` | `#dad1c4` | 代码块边框和顶栏分隔线 | 也被 Prompt 复用 |
| `--border-prompt` | `var(--border-code)` | Prompt 边框 | 当前与代码块边框完全同步 |
| `--border-react` | `#dcd6cd` | AI 回复顶栏分隔线 | AI 回复块没有外框，仅保留内部浅线 |

### 4.2 文字灰阶

| CSS 变量 | 当前值 | 人眼观感 | 主要使用位置 |
| --- | --- | --- | --- |
| `--gray-1000` | `#1d1b1b` | 接近黑色的暖黑 | 主要标题、品牌字标、正文强调、Hover |
| `--gray-900` | `#56534f` | 深暖灰 | 次要正文、作者、链接、引用 |
| `--gray-800` | `#6f6b66` | 中深暖灰 | 预留的中间灰阶，当前较少直接使用 |
| `--gray-700` | `#8a8680` | 柔和灰 | 日期、目录默认状态、弱化信息 |
| `--gray-alpha-100` | `rgba(29, 27, 27, 0.04)` | 极淡暖黑叠层 | 行内代码、标签、列表 Hover |
| `--gray-alpha-200` | `rgba(29, 27, 27, 0.07)` | 很淡边界 | 行内代码边框 |
| `--gray-alpha-400` | `rgba(29, 27, 27, 0.12)` | 默认分隔线 | 栏目线、文章线、表格、标签 |
| `--gray-alpha-500` | `rgba(29, 27, 27, 0.21)` | 较明显弱线 | 社交分隔符、kbd、Hover 边框 |
| `--gray-alpha-700` | `rgba(29, 27, 27, 0.46)` | 强边界 | 当前主要作为高对比参考色 |

### 4.3 棕色交互色与选择色

| CSS 变量或色值 | 当前值 | 使用位置 |
| --- | --- | --- |
| `--accent-700` | `#8b4513` | 栏目编号、焦点、引用边线、复选框、Hover |
| `--accent-800` | `#8b4513` | 正文链接、脚注、复制成功状态 |
| `--accent-100` | `rgba(36, 93, 98, 0.08)` | 默认引用的极淡背景 |
| `--accent-200` | `rgba(36, 93, 98, 0.14)` | 用户选中文字时的背景 |
| 首页文章标题 | `rgb(139, 69, 19)` | 与 `#8b4513` 相同，深棕色 |
| 标题常态下划线 | `rgb(190, 155, 128)` | 标题未 Hover 时的浅棕线 |

注意：CSS 原注释把 `accent` 称作“青绿色品牌色”，但当前实际主交互色已经是棕色。
只有 `--accent-100` 与 `--accent-200` 仍是很淡的蓝绿色透明叠层。恢复当前外观时应以表中数值为准。

### 4.4 Markdown notice 语义色

| 类型 | 浅背景变量 | 深色文字变量 | 用途 |
| --- | --- | --- | --- |
| Danger / 错误 | `#f9e8e5` | `#833b37` | 错误或危险提示 |
| Warning / 警告 | `#f4ead2` | `#8a5710` | 警告提示 |
| Success / 成功 | `#e4ede3` | `#8b4513` | 成功提示；当前深色仍使用棕色 |
| Info / 信息 | `#e3ebef` | `#365f80` | 信息提示 |

四类 notice 的实际背景不是直接使用浅色，而是：

```css
color-mix(in srgb, 语义浅色 48%, var(--surface-raised))
```

也就是把语义色和普通抬升纸面混合，避免提示框在暖纸背景上过于鲜艳。

## 5. 全站纸张、磨砂与颗粒效果

### 5.1 当前完整纸张纹理

```css
--paper-surface:
  radial-gradient(
    circle,
    rgba(93, 75, 57, 0.05) 0 0.45px,
    transparent 0.75px
  ) 0 0 / 4px 4px,
  radial-gradient(
    circle,
    rgba(255, 255, 255, 0.34) 0 0.4px,
    transparent 0.72px
  ) 2px 1px / 6px 6px,
  linear-gradient(
    115deg,
    rgba(112, 90, 66, 0.024) 25%,
    transparent 25%
  ) 0 0 / 8px 8px;
```

三层纹理从上到下分别是：

1. `4px × 4px` 的深棕微粒：模拟纸浆中的深色纤维点。
2. `6px × 6px` 的白色微粒：打破纯色平面，让纸面有细小明暗变化。
3. `115deg`、`8px × 8px` 的极淡斜纹：形成规整的磨砂与羊皮纸纤维方向。

页面实际使用方式：

```css
html {
  background: var(--background-100);
}

body,
.site-header {
  background: var(--paper-surface), var(--background-100);
}
```

项目卡片使用：

```css
.project-card {
  background: var(--paper-surface), #eee8de;
}
```

重要特征：

- 没有白色到黄色的大面积渐变。
- 没有使用 `backdrop-filter: blur(...)`；页眉明确设置为 `backdrop-filter: none`。
- 纸张感来自均匀重复的小颗粒和斜纹，而不是真实图片或模糊滤镜。
- 项目卡片也没有额外纸纹图片，直接复用 `--paper-surface`，因此容易维护。

### 5.2 如果只想调整纸张感

| 想要的效果 | 建议修改 |
| --- | --- |
| 纸粒更明显 | 提高两层 `radial-gradient` 的 alpha，例如 `0.05 → 0.07` |
| 纸粒更细腻 | 缩小微粒半径，或增大平铺尺寸 |
| 斜纹更明显 | 提高 `rgba(112, 90, 66, 0.024)` 的 alpha |
| 斜纹方向变化 | 修改 `115deg` |
| 页面整体更暖 | 修改 `--background-100`，并同步检查卡片与代码块表面 |
| 完全取消纸纹 | 从 `body`、`.site-header`、`.project-card` 的 `background` 中移除 `var(--paper-surface)` |

## 6. 各页面与组件的颜色归属

### 6.1 页面、页眉与文字选择

| 对象 | 选择器 | 当前外观 |
| --- | --- | --- |
| 页面底层 | `html` | `#f2ede3` |
| 页面可见背景 | `body` | 三层 `--paper-surface` + `#f2ede3` |
| 固定页眉 | `.site-header` | 与页面完全相同的纸纹和底色，无模糊 |
| 默认文字 | `body` | `#1d1b1b` |
| Huang 字标 | `.brand-mark` | `#1d1b1b` |
| 选中文字 | `::selection` | 背景 `rgba(36,93,98,0.14)`，文字 `#1d1b1b` |

### 6.2 首页自我介绍、社交入口和栏目标题

| 对象 | 默认颜色 | Hover / 其他状态 |
| --- | --- | --- |
| 自我介绍 | `#1d1b1b` | 无变色 |
| X、GitHub 图标和文字 | `rgb(79, 77, 74)` | `rgb(29, 27, 27)` |
| 社交文字下划线 | `rgb(197, 193, 187)` | `rgb(29, 27, 27)` |
| 社交入口间的圆点 | `rgba(29, 27, 27, 0.21)` | 无 |
| `01 / 项目` 等栏目标题 | `#8b4513` | 无 |
| 栏目标题右侧水平线 | `rgba(29, 27, 27, 0.12)` | 无 |
| 首页日期 | `#8a8680` | 无 |

社交 SVG 使用 `fill="currentColor"` 或 `stroke="currentColor"`，所以图标会自动跟随文字颜色。

### 6.3 项目列表

| 外观对象 | 当前参数 | 视觉作用 |
| --- | --- | --- |
| 行底色 | `transparent` | 保持纸面干净 |
| 行间分隔线 | `none` | 使用留白区分相邻项目 |
| Hover 背景 | `transparent` | 仅通过标题下划线和箭头提示交互 |
| 日期 | `#8a8680` | 与其他栏目共用左侧日期列 |
| 项目标题 | `rgb(139, 69, 19)` | 建立内容层级 |
| 项目简介 | `#74685d` | 保持较弱对比度 |
| 右侧箭头 | `#8a8680` | 提示可进入详情页 |

项目行与 Prompt、写作、阅读共用同一套列表结构和响应式规则。

### 6.4 首页文章列表与归档列表

| 对象 | 当前颜色或表面 |
| --- | --- |
| 普通归档列表分隔线 | `rgba(29, 27, 27, 0.12)` |
| 普通列表 Hover 背景 | `rgba(29, 27, 27, 0.04)` |
| 日期 | `#8a8680` |
| 普通标题 | `#1d1b1b` |
| 普通摘要 | `#56534f` |
| 首页标题 | `rgb(139, 69, 19)` |
| 首页标题默认下划线 | `rgb(190, 155, 128)`，`1px` |
| 首页标题 Hover 下划线 | `rgb(139, 69, 19)`，`1.5px` |
| 首页 description | `#34312f` |
| “所有文章 →” | `#56534f` |

首页列表特意删除文章之间的边线和 Hover 方块背景，依靠 `padding-block: 17px` 留白分组。

### 6.5 页脚

| 对象 | 默认 | Hover |
| --- | --- | --- |
| 页脚普通文字和年份 | `#8a8680` | 无 |
| 邮箱图标和文字 | `rgb(79, 77, 74)` | `rgb(29, 27, 27)` |
| 邮箱下划线 | `rgb(197, 193, 187)` | `rgb(29, 27, 27)` |

### 6.6 文章标题、元信息、标签与目录

| 对象 | 当前外观 |
| --- | --- |
| 标题区底部分隔线 | `rgba(29, 27, 27, 0.12)` |
| 文章主标题 | `#1d1b1b` |
| 文章 description | `#56534f` |
| 作者 | `#56534f` |
| 日期及其他元信息 | `#8a8680` |
| 作者后的圆点 | `rgba(29, 27, 27, 0.21)` |
| 标签边框 | `rgba(29, 27, 27, 0.12)` |
| 标签背景 | `rgba(29, 27, 27, 0.04)` |
| 目录左侧线 | `rgba(29, 27, 27, 0.12)` |
| “本文目录” | `#1d1b1b` |
| 目录默认链接 | `#8a8680` |
| 目录 Hover / 当前章节 | `#1d1b1b` |

### 6.7 正文、标题、引用与链接

| 对象 | 当前值 | 说明 |
| --- | --- | --- |
| 正文 | `#34312f` | 比暖黑稍浅，减少长文阅读压力 |
| 正文粗体 | `#1d1b1b` | 强调 |
| 删除线 | `#8a8680` | 弱化 |
| h1–h6 | `#1d1b1b` | 保持清晰层级 |
| 列表符号 | `#8a8680` | 不抢正文 |
| 通用引用文字 | `#56534f` | 楷体 |
| 通用引用左边线 | `#8b4513`，`3px` | 适用于非统一详情模板 |
| 通用引用背景 | `rgba(36, 93, 98, 0.08)` | 极淡蓝绿色 |
| 四栏目正文引用 | `#56534f` | 楷体 |
| 四栏目引用左边线 | `#8b4513`，`1px` | 当前实际文章使用 |
| 四栏目引用背景 | `transparent` | 保留书摘感，不使用底色 |
| 正文链接 | `#8b4513` | 棕色 |
| 正文链接默认下划线 | `rgba(250, 248, 244, 0.76)` | 很浅，接近纸张亮色 |
| 正文链接 Hover 下划线 | `#8b4513` | 强化可点击性 |
| Markdown 水平线 | `rgba(29, 27, 27, 0.12)` | 默认分隔线 |

## 7. 代码块、Prompt 与 AI 回复

### 7.1 普通代码块

| 对象 | 当前值 |
| --- | --- |
| 正文背景 | `#efe9df` |
| 顶栏背景 | `#e8e1d7` |
| 边框和顶栏分隔线 | `#dad1c4` |
| 代码正文 | `#403c37` |
| 文件名/语言标签 | `#69645e` |
| 复制按钮默认 | `#69645e` |
| 复制按钮 Hover 背景 | `#ffffff` |
| 复制按钮 Hover 文字 | `#1d1b1b` |
| 复制成功 | `#8b4513` |

阴影：

```css
box-shadow:
  0 14px 34px rgba(64, 54, 42, 0.055),
  0 2px 7px rgba(64, 54, 42, 0.035);
```

### 7.2 Prompt

Prompt 目前不是复制一组相似颜色，而是直接引用普通代码块变量：

```css
--surface-prompt: var(--surface-code);
--surface-prompt-toolbar: var(--surface-code-toolbar);
--border-prompt: var(--border-code);
```

因此普通代码块与 Prompt 的正文背景、顶栏背景、边框颜色始终一致。

Prompt 文字为 `#302d29`，阴影为：

```css
box-shadow: 0 4px 14px rgba(75, 58, 40, 0.045);
```

### 7.3 React / GPT / Claude / Gemini

| 对象 | 当前值 |
| --- | --- |
| 输出块背景 | `#ffffff` |
| 外边框 | `none` |
| 顶栏分隔线 | `#dcd6cd` |
| 正文 | `#34312f` |
| 阴影 | `0 2px 8px rgba(0, 0, 0, 0.04)` |

这一设计让 AI 输出像一张轻薄白纸浮在羊皮纸页面上，而不是使用锐利的黑色边框。

### 7.4 语法高亮色

| 代码类型 | CSS 选择器 | 当前颜色 | 设计含义 |
| --- | --- | --- | --- |
| 注释 | `.token-comment` | `#716b64` | 暖灰，并使用斜体 |
| 关键字、标签 | `.token-keyword`、`.token-tag` | `#98482f` | 陶土红，字重 600 |
| 字符串 | `.token-string` | `#3f7156` | 低饱和森林绿 |
| 属性名 | `.token-property` | `#6b528c` | 灰紫色 |
| 数字、常量 | `.token-number`、`.token-constant` | `#a04f42` | 砖红色 |

这些颜色比旧版明显，但仍围绕暖纸背景控制饱和度，没有采用深色编辑器的高亮霓虹色。

### 7.5 当前存在的一个维护提醒

复制按钮 Hover 中使用了：

```css
border-color: var(--gray-alpha-300);
```

但当前 `:root` 没有定义 `--gray-alpha-300`。因此浏览器会忽略这一条
`border-color`，复制按钮 Hover 主要依靠白色背景和深色图标表现。
这就是 **当前外观的一部分**，恢复原样时无需补值；以后若想修复，可先尝试：

```css
--gray-alpha-300: rgba(29, 27, 27, 0.09);
```

但这会改变当前视觉，修改前应单独预览。

## 8. 其他 Markdown 组件

| 组件 | 当前颜色与表面 |
| --- | --- |
| 行内代码 | 背景 `rgba(29,27,27,0.04)`；边框 `rgba(29,27,27,0.07)`；文字 `#1d1b1b` |
| 表格 | 背景 `rgba(250,247,241,0.8)`；边框 `rgba(29,27,27,0.12)` |
| 表头 | 背景 `rgba(29,27,27,0.035)`；文字 `#1d1b1b` |
| 普通 notice | 背景 `rgba(250,247,241,0.8)`；边框 `rgba(29,27,27,0.12)` |
| details | 背景 `rgba(250,247,241,0.8)`；边框 `rgba(29,27,27,0.12)` |
| kbd | 背景 `rgba(250,247,241,0.8)`；边框 `rgba(29,27,27,0.21)`；文字 `#1d1b1b` |
| mark 高亮 | 背景 `#e8dca7`；文字继承正文 |
| 脚注正文 | `#56534f` |
| 脚注编号 | `#8b4513` |
| 图库图片空白底 | `rgba(29,27,27,0.035)` |
| 图库滚动条 | `rgba(29,27,27,0.21)` |
| 未识别 Hugo 格式 | 红色虚线和文字 `#833b37` |

## 9. 上一篇、下一篇、返回首页与焦点

| 对象 | 当前外观 |
| --- | --- |
| 翻页卡片背景 | `rgba(250, 247, 241, 0.8)` |
| 翻页卡片 Hover 背景 | `rgba(250, 247, 241, 0.94)` |
| 翻页卡片边框 | `rgba(29, 27, 27, 0.12)` |
| Hover 边框 | `rgba(29, 27, 27, 0.21)` |
| 卡片说明 | `#8a8680` |
| 卡片标题 | `#1d1b1b` |
| 返回首页 | `#56534f`，Hover 为 `#1d1b1b` |
| 全站键盘焦点内环 | `0 0 0 2px #f2ede3` |
| 全站键盘焦点外环 | `0 0 0 4px #8b4513` |

## 10. 图标与非 CSS 颜色

### 10.1 favicon

`public/favicon.svg` 使用三种蓝色：

| 色值 | 用途 |
| --- | --- |
| `#68C4FF` | 浅蓝模块 |
| `#0C79D8` | 深蓝模块 |
| `#2E9EFF` | 中蓝主体 |

favicon 独立于暖色网站页面，修改它不会改变正文或卡片。

### 10.2 社交与项目链接图标

X、GitHub、邮箱和项目网址 SVG 使用 `currentColor`，颜色由父元素 CSS 决定。
恢复时应同时保留 SVG 的 `fill="currentColor"` 或 `stroke="currentColor"`。

### 10.3 AI 模型图标

以下图标由 `scripts/markdown.mjs` 中的外部 URL 加载：

- GPT：`https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/chatgpt-icon.svg`
- Claude：`https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/claude-ai-icon.svg`
- Gemini：`https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/google-gemini-icon.svg`

它们的内部颜色不受本站 CSS 色板控制。若要做到完全离线、长期稳定的 1:1 恢复，
应在未来获得合适授权后将图标保存为本地资源，并记录文件哈希。

## 11. 与颜色共同决定外观的参数

只恢复颜色仍可能“看起来不像原站”，因为圆角、字体、宽度和动效也会影响观感。

### 11.1 圆角

| 变量 | 当前值 | 使用对象 |
| --- | --- | --- |
| `--radius-sm` | `6px` | 表格、notice、details、翻页卡片 |
| `--radius-md` | `12px` | 项目卡片 |
| `--radius-lg` | `16px` | 大型表面预留 |
| 代码块 / Prompt | `12px` | 单独写在组件中 |
| 标签胶囊 | `9999px` | 文章标签和 notice legend |

### 11.2 关键宽度与密度

| 对象 | 当前值 |
| --- | --- |
| 全站最大宽度 | `1040px` |
| 首页最大宽度 | `880px` |
| 正文最大宽度 | `740px` |
| 目录宽度 | `220px` |
| 项目网格 | 桌面 3 列，间距 `16px` |
| 项目卡片最小高度 | `208px` |
| 桌面端页面总左右留白 | `48px` |
| 手机端页面总左右留白 | `32px` |

### 11.3 主要字体体系

字体变量也是外观备份的一部分。浏览器会按从左到右的顺序寻找本机或在线可用字体。

| CSS 变量 | 当前完整字体栈 | 主要区域 |
| --- | --- | --- |
| `--sans` | `"Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", "PingFang SC", "Microsoft YaHei", serif` | 全站默认 |
| `--mono` | `"Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", serif` | 日期与小型编号；名称保留自早期设计，目前并非真正等宽 |
| `--code-font` | `"Geist Mono", "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif` | 代码、文件名、标签、kbd |
| `--title-serif` | `"Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif` | 英文标题、社交入口 |
| `--serif` | `"Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif` | 归档页标题等通用衬线区域 |
| `--source-han-serif` | `"Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", "Source Han Serif CN", "Songti SC", SimSun, serif` | 中文标题和首页简介 |
| `--kai` | `"Libre Baskerville", Georgia, "Kaiti SC", STKaiti, KaiTi, "楷体", serif` | 通用楷体备用栈 |
| `--editorial` | `"Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif` | 页眉、页脚、首页与归档 |
| `--body-reading` | `"Times New Roman", "Noto Serif SC", "Source Han Serif SC", "Source Han Serif CN", "Songti SC", SimSun, serif` | 正文英数与中文宋体 |
| `--body-kai` | `"Times New Roman", "Kaiti SC", STKaiti, KaiTi, "楷体", serif` | 引用英数与中文楷体 |
| `--codex-ui-font` | `"OpenAI Sans", ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif` | Prompt 与 AI 回复 |

### 11.4 动效

| 对象 | 当前动效 |
| --- | --- |
| 项目卡片 | Hover 上移 `2px`；按下缩放 `0.99` |
| 首页标题下划线 | `0.2s ease` 由浅棕变深棕并由 `1px` 增至 `1.5px` |
| 社交、邮箱和项目链接 | `200ms ease` 变深 |
| 列表箭头 | Hover 向右 `3px` |
| 项目箭头 | Hover 向右上移动 `2px` |
| 目录当前章节 | `160ms ease` 变为暖黑 |
| 复制成功图标 | `180ms ease`，双方框收缩为单方框 |

用户开启 `prefers-reduced-motion: reduce` 时，全站 transition 会关闭，
项目卡片也不会移动或缩放。

## 12. 当前完整核心变量备份

如果未来大范围换色后想恢复，先把下面内容与 `public/styles.css` 的 `:root` 对照。
它涵盖决定当前色系、纸面、边框与组件表面的核心值：

```css
:root {
  color-scheme: light;

  --background-100: #f2ede3;
  --background-200: rgba(29, 27, 27, 0.035);
  --surface-raised: rgba(250, 247, 241, 0.8);
  --surface-code: #efe9df;
  --surface-code-toolbar: #e8e1d7;
  --surface-prompt: var(--surface-code);
  --surface-prompt-toolbar: var(--surface-code-toolbar);
  --surface-react: #ffffff;
  --surface-hover: rgba(250, 247, 241, 0.94);
  --border-code: #dad1c4;
  --border-prompt: var(--border-code);
  --border-react: #dcd6cd;

  --paper-surface:
    radial-gradient(
      circle,
      rgba(93, 75, 57, 0.05) 0 0.45px,
      transparent 0.75px
    ) 0 0 / 4px 4px,
    radial-gradient(
      circle,
      rgba(255, 255, 255, 0.34) 0 0.4px,
      transparent 0.72px
    ) 2px 1px / 6px 6px,
    linear-gradient(
      115deg,
      rgba(112, 90, 66, 0.024) 25%,
      transparent 25%
    ) 0 0 / 8px 8px;

  --gray-1000: #1d1b1b;
  --gray-900: #56534f;
  --gray-800: #6f6b66;
  --gray-700: #8a8680;
  --gray-alpha-100: rgba(29, 27, 27, 0.04);
  --gray-alpha-200: rgba(29, 27, 27, 0.07);
  --gray-alpha-400: rgba(29, 27, 27, 0.12);
  --gray-alpha-500: rgba(29, 27, 27, 0.21);
  --gray-alpha-700: rgba(29, 27, 27, 0.46);

  --accent-100: rgba(36, 93, 98, 0.08);
  --accent-200: rgba(36, 93, 98, 0.14);
  --accent-700: #8b4513;
  --accent-800: #8b4513;

  --red-100: #f9e8e5;
  --red-800: #833b37;
  --amber-100: #f4ead2;
  --amber-800: #8a5710;
  --green-100: #e4ede3;
  --green-800: #8b4513;
  --blue-100: #e3ebef;
  --blue-800: #365f80;

  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --page-width: 1040px;
  --article-width: 740px;
}
```

## 13. 完整恢复流程

1. **先备份未来版本**  
   在恢复前复制一份未来的 `public/styles.css`，避免丢失新设计。

2. **恢复核心变量**  
   用第 12 节对照 `:root`，优先恢复背景、纸纹、灰阶、棕色强调色、表面和边框。

3. **恢复直接写在组件中的颜色**  
   重点对照第 6–10 节。以下颜色没有全部抽成变量，最容易被遗漏：
   `#34312f`、`#302d29`、`#403c37`、`#69645e`、
   `rgb(79,77,74)`、`rgb(197,193,187)`、
   `rgb(139,69,19)`、`rgb(190,155,128)`。

4. **恢复阴影和纸张层次**  
   重点检查 `.project-card`、`.code-block`、`.prompt-block` 和 `.react-block`。

5. **恢复字体、圆角和宽度**  
   如果颜色已经一致但仍“感觉不对”，通常是字体、行距、阴影、圆角或最大宽度不同。

6. **运行验证**

   ```powershell
   npm test
   ```

7. **本地预览**

   ```powershell
   npm run dev
   ```

   建议至少检查：首页、项目正文、Writing 正文、带代码块的文章、带 Prompt/GPT 的文章、
   长目录、手机窄屏和键盘焦点。

## 14. 恢复完成后的核对清单

- [ ] 页面和页眉都是均匀的轻暖羊皮纸，没有白黄大范围渐变。
- [ ] 页面能看见极轻深浅纸粒和 `115deg` 斜纹。
- [ ] 项目卡片比页面略深，拥有纸片厚边和柔和投影。
- [ ] 首页标题是深棕色，默认有浅棕下划线，Hover 后变深并略加粗。
- [ ] 正文为柔和的 `#34312f`，标题为暖黑 `#1d1b1b`。
- [ ] 引用使用楷体、细棕色左线、透明底色。
- [ ] 代码块和 Prompt 使用相同暖灰表面。
- [ ] AI 回复为白色纸片，无黑色外框，只有极轻投影。
- [ ] 代码高亮呈陶土红、森林绿、灰紫与砖红。
- [ ] 社交、项目链接和邮箱默认灰褐，Hover 后变暖黑。
- [ ] 目录当前章节由灰色变为暖黑。
- [ ] 键盘操作时出现羊皮纸内环和棕色外环。

## 15. 这份文档与其他设计文档的关系

- `docs/DESIGN-SYSTEM.md`：解释整体设计方向和布局原则。
- `docs/UI-EDITING-GUIDE.md`：告诉开发者到哪里修改 UI。
- `docs/VISUAL-APPEARANCE-BACKUP.md`：记录当前实际色值、纹理、阴影和恢复方法，属于精确备份。

如果其他文档中的旧色值与本文件冲突，恢复 **2026-07-24 当前外观** 时以本文件和
`public/styles.css` 的基准指纹为准。
