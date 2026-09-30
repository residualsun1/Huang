# Huang UI / UX 参数基线与色彩恢复记录

## 1. 记录范围与版本

这份文档记录 2026-09-30（Asia/Shanghai）修改色彩前的本地源码状态，供后续对照和复原。记录时工作区无未提交修改，Git 基准为 e6eefc62239e6980593ddf86c4a998857a4ea88f。参数来自当前 CSS、页面生成器与交互脚本；未进行浏览器截图或各设备实测，不将源码参数当作已经测得的屏幕坐标。

| 项目 | 基准 |
| --- | --- |
| 主要视觉源文件 | public/styles.css，47,896 bytes |
| CSS SHA-256 | 88c2cec3146e2df84651cb1bf37f855b71fc84e6dafc35811e5a0d690787df9e |
| 主题 | 浅色；暖米白底、棕色链接、暖灰正文 |
| 背景纹理 | 当前有效值为 --paper-surface: none；旧渐变在注释中，不生效 |
| 首页结构 | 年轮图标 → 三段英文简介 → GitHub / X → 项目 → 写作 → 阅读 → 页脚 |
| 归档页 | 日期、标题、箭头；无摘要 |
| 详情页 | 面包屑、标题、作者与历史、标签、正文、条件显示目录、上下篇、回到首页 |
| 页面生成器 | scripts/build.mjs |
| Markdown 组件结构 | scripts/markdown.mjs |
| 生成目录 | dist/client/；构建时重建，不能作为长期修改源 |

旧版 [视觉备份](VISUAL-APPEARANCE-BACKUP.md) 记录的是 2026-07-24，保留作为历史档案。本次恢复以本文件、基准提交和当前源码快照为准。下文记录最终生效的覆盖关系；附录保留完整 CSS，包括基础规则、响应式覆盖及注释。

## 2. 配色总览

### 2.1 页面与组件表面

| 参数 | 基准值 | 作用 |
| --- | --- | --- |
| --background-100 | #fcf5e4 | 全页、页眉、翻页卡片、焦点环隔离层 |
| --background-200 | rgba(29, 27, 27, 0.035) | 表头、画廊图片底色 |
| --surface-raised | rgba(255, 252, 244, 0.82) | 表格、details、kbd、音频播放器与状态框 |
| --surface-code | #f4ecda | 普通代码正文；Prompt 通过变量别名复用 |
| --surface-code-toolbar | #e4dcc8 | 普通代码与 Prompt 工具栏 |
| --surface-react | #fffaf0 | AI 回复纸面、复制按钮 Hover 底色 |
| --surface-hover | rgba(255, 252, 244, 0.94) | 已声明，但当前 CSS 没有使用此变量 |
| --border-code | #d5cdbb | 普通代码外框、顶栏分隔线；Prompt 同步复用 |
| --border-react | #e4dcc8 | AI 回复顶栏分隔线 |
| --paper-surface | none | 当前为纯色纸面；不启用颗粒或斜纹 |
| HTML theme-color | #fcf5e4 | scripts/build.mjs 中浏览器主题色，独立于 CSS |

--surface-prompt = var(--surface-code)，--surface-prompt-toolbar = var(--surface-code-toolbar)，--border-prompt = var(--border-code)。改代码块变量会同时改变 Prompt 组件。

### 2.2 文字、边界与品牌色

| 参数 | 基准值 | 主要角色 |
| --- | --- | --- |
| --gray-1000 | #1d1b1b | 简介、强调、标题、目录当前项及 Hover |
| --gray-900 | #56534f | 作者、引用、次级文字、返回入口 |
| --gray-800 | #6f6b66 | 音频作者、时间、加载状态 |
| --gray-700 | #8a8680 | 日期、目录默认项、图注、脚注相关弱化信息 |
| --gray-alpha-100 | rgba(29, 27, 27, 0.04) | 行内代码、标签底色、通用列表 Hover |
| --gray-alpha-200 | rgba(29, 27, 27, 0.07) | 行内代码边界 |
| --gray-alpha-400 | rgba(29, 27, 27, 0.12) | 栏目线、文章线、表格、目录边界、卡片 |
| --gray-alpha-500 | rgba(29, 27, 27, 0.21) | 元信息分隔点、kbd、卡片 Hover 边界 |
| --gray-alpha-700 | rgba(29, 27, 27, 0.46) | 已声明，当前没有 var() 引用 |
| --accent-100 | rgba(139, 69, 19, 0.08) | 通用引用底色；当前详情引用覆盖为透明 |
| --accent-200 | rgba(139, 69, 19, 0.14) | 选中文字底色 |
| --accent-700 / --accent-800 | #8b4513 / #8b4513 | 栏目标签、正文链接、引用左线、焦点环、播放器进度 |

### 2.3 不受主色变量控制的直接色值

只修改 :root 不会自动改变下表全部位置。附录保存了每条完整选择器及声明。

| 位置 / 选择器 | 常态 | Hover / 特殊状态 |
| --- | --- | --- |
| .home .writing-copy strong | rgb(139, 69, 19) | 标题文字色不变 |
| .home .writing-title-text | 下划线色 rgb(190, 155, 128)；常态未声明下划线线型 | Hover 才出现 underline，色 rgb(139, 69, 19)，厚 1.5px |
| .home .writing-copy > span | #74685d | 继承常态 |
| .collection-header h1、.listing .writing-copy strong、.prose、.react-block .prompt-content | #34312f | 按各组件规则 |
| .social-links、.footer-email | rgb(79, 77, 74)；文字下边框 rgb(197, 193, 187) | 文字与下边框均 rgb(29, 27, 27) |
| .toolbar-label、.inline-prompt-copy-btn | #595959 | 复制按钮 Hover 使用 --gray-1000 |
| .prose pre | #403c37 | — |
| .prompt-content | #302d29 | AI 回复覆盖 #34312f |
| .token-comment | #716b64，italic | — |
| .token-keyword、.token-tag | #98482f，600 | — |
| .token-string | #3f7156 | — |
| .token-property | #6b528c | — |
| .token-number、.token-constant | #a04f42 | — |
| .prose a 下划线 | rgb(190, 155, 128) | --accent-700 |
| .prose mark | #e8dca7 | 文字继承 |
| .audio-embed .aplayer-pic | #ded5c8 | 封面图片可以遮盖背景 |
| a.article-pagination-item:hover | 底色 #f7f0de | 边框 --gray-alpha-500 |
| .pin-badge | 背景/边框 --red-800；文字 #fff | — |

### 2.4 提示框实际语义色

notice 组件使用局部变量，不能根据 :root 中 --blue-*、--green-* 等名字推断实际配色。

| 变体 | --notice-surface | --notice-border | --notice-accent |
| --- | --- | --- | --- |
| 默认 / .notice-content | #ebe4d9 | rgba(106, 85, 65, 0.26) | #79583f |
| .notice-warning | #f0e5cf | rgba(144, 94, 34, 0.3) | #8a571c |
| .notice-info | #e2e9e5 | rgba(62, 99, 96, 0.28) | #3f6664 |
| .notice-success | #e4e9dc | rgba(81, 107, 72, 0.28) | #536f49 |
| .notice-danger | #eee0db | rgba(135, 70, 58, 0.28) | #884a3e |

根变量还保留 --red-100 #f9e8e5、--red-800 #833b37、--amber-100 #f4ead2、--amber-800 #8a5710、--green-100 #e4ede3、--green-800 #8b4513、--blue-100 #e3ebef、--blue-800 #365f80。--green-800 当前也是棕色；保持记录原值。全部根变量及未引用标记见附录 A。

## 3. 字体与文字比例

| 区域 | 字体 / 颜色 | 桌面有效参数 | ≤600px |
| --- | --- | --- | --- |
| 首页简介 .hero-intro | Times New Roman, Times, serif / --gray-1000 | 最大 760px；30px / 1.3；400；字距 0；段间 24px | 同字号、行高、间距 |
| 社交入口 | --title-serif / rgb(79, 77, 74) | 13px / 20px | 同桌面 |
| 栏目标题 | --title-serif / --accent-700 | 14px / 20px；600；字距 0.08em | 字号不变 |
| 首页条目标题 | --title-serif / rgb(139, 69, 19) | 16px / 24px；700；继承字距 -0.025em | .home 高特异性规则仍为 16px / 24px |
| 首页摘要 | --body-reading / #74685d | 13.8px / 23.5px；最多两行；左对齐；hyphens: auto | 同桌面 |
| 日期 | --mono / --gray-700 | 12px / 20px；顶部 3px；tabular-nums | 同桌面 |
| 归档标题 h1 | --serif / #34312f | clamp(32px, 5vw, 44px) / 1.08；400；字距 -0.02em | 继续使用 clamp |
| 归档条目 | 继承 --editorial / #34312f | 17px / 25px；400；字距 -0.01em | 高特异性规则保持 17px / 25px |
| 文章页标题 | --source-han-serif / --gray-1000 | clamp(38px, 5vw, 52px) / 1.18；600；最大 820px；字距 -0.035em | 字号 36px；详情规则的行高 1.18、字距 -0.035em 仍生效 |
| 文章元信息 | --title-serif / --gray-700 | 12px / 16px；作者 --gray-900 | 同桌面，布局变为纵向 |
| 正文 .detail-editorial .prose | --body-reading / #34312f | 15.5px / 1.75；字距 0.01em | 16px / 1.76；字距 0.005em |
| 正文引用 | --body-kai / --gray-900 | 17px / 1.88；正常字体样式 | 16px / 1.88 |
| 目录标题 / 条目 | --body-reading | 14.5px / 22px，600 / 13.5px / 20px | ≤960px 隐藏 |
| 代码 | --code-font / #403c37 | 14px / 1.7；tab-size: 2 | 13px / 1.7 |
| Prompt / AI 回复正文 | --codex-ui-font | 15.5px / 1.8；pre-wrap | 15px / 1.8 |
| 脚注 | --body-reading / --gray-900 | 14px / 24px；编号 Times New Roman | 同桌面 |
| 页脚邮箱 / 年份 | --title-serif | 14px / 继承16px；年份12px / 16px | 同桌面 |

字体变量全栈见附录 A。名称 --sans 和 --mono 当前都优先 Libre Baskerville，不能按变量名理解成无衬线或等宽字体。真正代码栈使用 Geist Mono 与中文无衬线回退；正文英数优先 Times New Roman，中文回退 Noto Serif SC / Source Han Serif SC / Songti SC / SimSun。

| 字体资源 | 来源 / 配置 |
| --- | --- |
| Libre Baskerville | Google Fonts，400 / 700，display=swap |
| Noto Serif SC | Google Fonts，400 / 500 / 600 / 700，display=swap |
| Geist Mono | jsDelivr geist@1.7.2，变量字重100–900，font-display: swap |
| FandolKai | 优先本机楷体系列；回退 jsDelivr / residualsun1/infont/AR-PL-KaitiM-GB-from-yihui.woff2，400 |
| FandolKai TC | 优先 Kaiti TC / BiauKai / DFKai-SB / AR PL KaitiM Big5；回退站内 /fonts/AR-PL-KaitiM-Big5.woff2，400 |
| OpenAI Sans | 仅字体栈声明；无专门下载，缺失时走系统无衬线 |

正文内部标题均字重600、颜色 --gray-1000、字距 -0.035em，使用 --source-han-serif；h1–h4 开启 optimizeLegibility 与 kerning。h1–h6 锚点 scroll-margin-top 均96px。

| 正文层级 | 桌面字号 / 行高 | 上、下 margin | ≤600px 字号 / 行高 |
| --- | --- | --- | --- |
| h1 | 36px / 44px | 2.4em / 0.9em | 30px / 38px |
| h2 | 28px / 36px | 2.5em / 0.9em | 26px / 34px |
| h3 | 22px / 30px | 2.25em / 0.75em | 21px / 29px |
| h4 | 18px / 28px | 2em / 0.7em | 18px / 27px |
| h5 / h6 | 16px / 24px | 1.8em / 0.6em | 同桌面 |

## 4. 页面尺寸与留白

### 4.1 通用框架与首页

| 参数 / 选择器 | >600px | ≤600px |
| --- | --- | --- |
| 通用容器 | min(100% - 48px, 1040px)，居中 | min(100% - 32px, 1040px)，居中 |
| 首页页眉 / 页脚 | min(100% - 48px, 1020px) | 通用规则覆盖，总留白32px，最大1040px |
| .home-layout | min(100% - 48px, 1020px)；底部112px | min(100% - 40px, 1020px)；底部112px |
| 首页页眉 | static；min-height 172px；padding-top 82px | min-height 114px；padding-top 24px |
| 首页图标 | 90×90px，object-fit: contain | 90×90px |
| 其他页面页眉 | sticky；top 0；z-index 20；min-height 64px | min-height 56px |
| 其他页面图标 | 40×40px | 36×36px |
| .hero | max(620px, 100svh - 317px)；底部padding 76px | max(580px, 100svh - 109px)；底部padding 36px |
| 简介在 hero 内的位置 | flex-end，介绍与社交整体靠底 | 同桌面 |
| 社交区 | margin-top 24px；gap 14px；链接内gap 7px | 同桌面 |
| .content-section | 顶padding15px；锚点scroll-margin64px | 通用顶padding48px |
| 第一个 #projects | 顶padding15px | 高特异性规则仍为15px |
| 后续相邻栏目 | min-width601px规则：顶padding48px | 顶padding48px |
| .section-heading | 顶padding48px；底margin20px | 顶padding16px；底margin16px |
| 栏目文字与横线 | gap12px；轨道height20px，横线1px，垂直居中 | gap10px |
| .writing-row 三列 | 112px / minmax(0,1fr) / 32px；gap24px | 82px / minmax(0,1fr) / 20px；gap10px |
| 首页条目padding | 上下17px，左右12px | 上下20px，左右8px |
| 标题与摘要 | grid，gap8px；摘要最大780px | 同桌面 |
| 所有文章 / 所有项目 | 右对齐；margin-top18px；内部gap7px | 同桌面 |

hero 先声明 vh 版本，再声明 svh 版本；不支持 svh 的浏览器保留前者。这里是最小高度而非固定高度，文字换行和屏幕高度都会改变首屏分布。不要将“某个栏目在所有设备首屏之外”当作这些参数保证的结果。

首页列表无上下边框、无 Hover 底色；首页标题可换行、overflow-wrap:anywhere。基础列表标题是单行省略，首页规则会覆盖该行为。首页摘要为空时不生成摘要元素；有摘要时最多两行。

### 4.2 归档、详情与页脚

| 区域 | 当前参数 | 响应式覆盖 |
| --- | --- | --- |
| 归档容器 | 最大760px；总侧留白48px；底padding96px | ≤600px 总侧留白32px |
| 归档标题区 | padding64px 0 26px；h1顶margin10px | padding52px 0 24px |
| 归档条目 | padding16px 4px；无分隔线、无 Hover 底色；无摘要 | .listing 特异性更高，仍为16px 4px |
| 归档返回首页 | margin-top28px；返回对应首页栏目锚点 | 不变 |
| 面包屑 | 顶padding40px；gap8px | 顶padding24px |
| 文章标题区 | 最大920px；padding64px 0；底线1px | padding48px 0 |
| 文章元信息 | 标题下24px；flex-wrap；gap14px 24px | 纵向，左对齐 |
| 作者 / 历史 | inline-flex，wrap，gap8px；中点分隔 | 按可用宽度换行 |
| 文章标签 | gap6px；最小高24px；padding4px 8px；胶囊9999px | 左对齐 |
| .article-layout | minmax(0,740px) + 220px；gap80px；居中 | ≤960px 单列，最大740px |
| 正文 | 上margin40px，下margin50px | 上margin48px，下margin仍50px |
| 段落 | margin-bottom1.45em | 直属 .prose > p 底margin2em |
| 目录 | sticky top96px；max-height:100vh-120px；顶margin64px；padding0 8px 8px 16px；左线1px | ≤960px 隐藏 |
| 上下篇容器 | 两列等宽；gap12px；详情页无顶线和顶padding | ≤600px 单列 |
| 上下篇卡片 | min-height112px；padding18px；内部gap18px；圆角6px；边框1px | min-height104px |
| 返回首页 | 与正文主列左边缘对齐；margin24px 0 96px | 底margin72px |
| 全站页脚 | min-height96px；flex row；space-between；gap24px；无边线 | min-height88px；仍为row；顶对齐；gap8px |

桌面文章两列总理想宽度为1040px（740+80+220）。容器较窄且仍大于960px断点时，minmax() 中的正文列可以收缩，因此740px是上限。页面没有目录时仍保留当前模板/CSS的规则，不补写新的布局方案。

## 5. Markdown 与扩展组件

| 组件 | 基准尺寸与行为 |
| --- | --- |
| 普通列表 | margin-bottom1.5em；左padding1.5em；li margin0.45em 0、左padding0.15em；标记 --gray-700 |
| 多级列表 | margin0.45em 0 0.3em；左padding1.55em；二层circle、三层square |
| 详情引用 | margin2.5em 1.25em；padding0.2em 0 0.2em 1.35em；左线1px棕色；透明底；≤600px 横margin0、左padding1.1em |
| 列表内引用 | margin0.85em 0 0.65em |
| 行内代码 | padding0.15em 0.38em；边框1px；圆角4px；字号0.84em |
| 代码外壳 | margin2em 0；边框1px；圆角12px；阴影见下表；≤600px 横margin-8px、圆角10px |
| 代码工具栏 | min-height40px；padding3px 10px 3px 14px；gap20px；≤600px min-height38px，padding2px 8px 2px 12px |
| 代码正文 | padding22px；max-height:min(70vh,720px)；overflow:auto；≤600px padding18px 16px |
| 复制按钮 | 34×34px；圆角6px；透明底和透明1px边框；15×15px SVG、stroke-width2 |
| Prompt 外壳 | margin1.7em 0；圆角12px；边框1px；单层轻阴影 |
| Prompt 工具栏 | min-height44px；padding5px 12px 5px 16px；gap20px；≤600px min-height42px、padding4px 10px 4px 14px |
| Prompt 标题 | 无衬线UI栈；14px；650；字距0.055em；图标与文字gap12px |
| Prompt 正文 | padding13px 20px 16px；white-space:pre-wrap；overflow-wrap:anywhere；≤600px padding12px 16px 14px |
| AI 回复块 | 无外框；--surface-react 底色；顶栏透明、底线 --border-react；沿用Prompt尺寸 |
| 模型图标 | GPT / Claude / Gemini：17×17px；外部SVG；通用代码形图标14×14px |
| Markdown 分隔线 | 高1px；margin64px 0；--gray-alpha-400 |
| 单图 | max-width100%；height:auto；圆角6px；figure margin2.5em 0；图片居中 |
| 图注 | 顶margin10px；12px / 16px；居中；--gray-700 |
| 横向画廊 | grid-auto-columns:min(84%,640px)；gap16px；横向滚动；x mandatory snap；底padding12px；图片16:10、contain；≤600px 列宽92% |
| 表格 | 包装器margin2em 0、圆角6px、边框1px、横向滚动；表格min-width560px；14px / 20px；单元padding12px 14px；表头13px/600 |
| notice | margin2em 0；1px边框、3px语义左线；圆角10px；legend左margin18px、右padding7px、15px/21px/700/字距0.04em；body padding16px 20px 5px |
| details / summary | margin2em 0；padding16px 18px；边框1px、圆角6px；summary14px/20px/600；展开时summary底margin16px |
| kbd | 最小宽1.75em；padding1px 6px；边框1px、底边2px；圆角4px；字号0.75em、行高1.45 |
| mark | padding0.04em 0.2em；背景 #e8dca7 |
| 任务列表 | 无项目符号；checkbox右margin8px，accent-color棕色 |
| 脚注编号 | 左margin2px；字号0.72em；方括号；返回符号↩使用文本样式 |
| 脚注列表 | 顶margin64px；分隔线下margin24px；gap8px；每条左padding34px；编号绝对定位left0 |
| 长公式 | .katex-display 横向滚动、纵向隐藏；上下padding0.2em |
| 音频嵌入 | margin2.25em 0；≤600px 为2em 0；原生audio宽100%、最小高54px |
| APlayer | 外框1px；圆角12px；标题14px/600；进度、滑块和音量色 --accent-700（!important） |
| 音频图注 | 顶margin9px；gap4px 10px；12.5px / 19px；可wrap；≤600px gap3px 8px |
| 音频加载状态 | padding14px 16px；边框1px；圆角12px；13px / 22px；错误时虚线边框 |
| 未识别旧格式 | grid gap8px；margin2em 0；padding16px；红色虚线1px、圆角6px；代码字体12px |

| 阴影使用位置 | 完整值 |
| --- | --- |
| 普通代码块 | 0 14px 34px rgba(64,54,42,0.055), 0 2px 7px rgba(64,54,42,0.035) |
| Prompt | 0 4px 14px rgba(75,58,40,0.045) |
| AI 回复 | 0 2px 8px rgba(0,0,0,0.04) |
| 音频播放器 | 0 8px 24px rgba(64,49,34,0.06) |
| 通用键盘焦点 | 0 0 0 2px var(--background-100), 0 0 0 4px var(--accent-700) |

## 6. 交互与阅读行为

| 功能 | 当前行为 / 参数 | 源文件 |
| --- | --- | --- |
| 首页内容选择 | 每栏目全部置顶优先，再用最新普通内容补足3项；置顶超过3项全部展示；栏目内按日期降序 | scripts/build.mjs / selectHomeEntries |
| 首页摘要 | 仅取显式description；缺失时无摘要；归档不显示摘要 | scripts/build.mjs / loadContent、homePage、collectionPage |
| 首页条目点击 | 整行a链接进入详情；无独立项目图标/仓库/项目地址入口 | scripts/build.mjs / listRow |
| 置顶徽标 | 桌面标题旁：高18px、padding0 7px、10px/700；手机日期下：高17px、左右6px、9.5px、顶margin3px | public/styles.css |
| 社交链接 | GitHub在前、X在后，中点分隔；新标签 target=_blank，rel=noreferrer；SVG14px | scripts/build.mjs / socialNavigation |
| 返回导航 | 品牌到首页；归档回对应栏目；文章面包屑到首页/归档；正文底部回首页 | scripts/build.mjs |
| 页脚 | mailto:Residualsun@proton.me；邮箱SVG14px；固定文案©2026 Huang | scripts/build.mjs / siteFooter |
| 上下篇 | 同栏目相邻日期；上一篇较早，下一篇较新；缺项渲染非链接span，opacity0.46 | scripts/build.mjs / articlePagination |
| 目录生成 | 从正文h2–h4生成；少于2个标题不显示目录；目录tabindex=0 | scripts/build.mjs / createTableOfContents |
| 目录当前项 | 标题top≤132px时视为已读到，选最后一个满足条件的项；设置aria-current=location | public/toc.js |
| 目录内部保持可见 | 可见上留白36px，下留白12px；自动调整自身scrollTop；requestAnimationFrame合并更新 | public/toc.js |
| 锚点滚动 | html scroll-padding-top88px；正文标题margin-top预留96px；目录点击处理中文hash、更新URL | public/styles.css、public/toc.js |
| 复制 | secureContext优先Clipboard API；否则隐藏textarea；成功置is-copied；失败显示Copy failed；1600ms后恢复 | public/code-blocks.js |
| 复制图标反馈 | 成功后path透明度0并translate(-3px,3px) scale(0.82)，rect保留 | public/styles.css |
| 音频增强 | APlayer1.10.1；autoplay false，preload none，loop none，order list，volume0.7，mutex true，listFolded true，lrcType0 | public/audio-player.js |
| 音频降级 | 直接音频播放器初始化失败保留原生audio；Meting2.0.2观察DOM，10,000ms未就绪显示错误 | public/audio-player.js |
| 音频成功态 | 隐藏重复曲名和艺术家图注；有来源入口时仅保留来源，右对齐 | public/styles.css |
| 数学 | KaTeX0.18.1，按内容加载；throwOnError:false；支持$$、反斜线方括号、反斜线圆括号、单$ | scripts/build.mjs、public/math.js |
| 标签与历史 | 标签是文字胶囊，无过滤功能；修改日期/次数取Git历史，不取本地未提交保存 | scripts/build.mjs |

| 动效 / 状态 | 基准 |
| --- | --- |
| 行背景 / 行箭头颜色 | 150ms ease；首页与归档行背景透明 |
| 行箭头、所有文章箭头 | 向右3px，150ms cubic-bezier(0.175,0.885,0.32,1.1) |
| 首页标题下划线 | 颜色与厚度200ms ease |
| 社交 / 邮箱 | 颜色、下边框200ms ease |
| 正文链接下划线 | 颜色150ms ease；offset4px |
| 目录 | 颜色160ms ease；常态弱灰，Hover/当前项暖黑 |
| 复制按钮 | 边界、文字、背景150ms ease；图标opacity/transform180ms ease |
| 翻页卡片 | 边界、transform150ms ease；Hover向上2px；背景另按Hover规则变色 |
| 键盘焦点 | :focus-visible，outline0，双层2px/4px色环；目录额外1px轮廓、offset4px |
| 减少动态 | prefers-reduced-motion:reduce：scroll-behavior:auto；所有过渡none !important；播放器loading SVG动画none |

页面viewport为width=device-width, initial-scale=1；html文本自动调整100%。图标用currentColor的SVG跟随文字颜色，年轮PNG、favicon、分享PNG及模型外部SVG本身不会被主色变量自动染色。屏幕阅读器隐藏标题使用.sr-only；社交、面包屑、目录、音频按钮和翻页保留aria标签。

## 7. 断点、级联与现有实现细节

| 条件 | 影响 |
| --- | --- |
| min-width:601px | 后续相邻首页栏目顶padding48px |
| max-width:960px | 文章改为单列、目录隐藏 |
| max-width:600px | 手机容器、页眉、hero、列表、文章元信息、组件padding与上下篇单列 |
| prefers-reduced-motion:reduce | 锚点和过渡的动态效果 |

CSS值要结合选择器特异性与顺序恢复。首页标题16px并未被通用手机17px覆盖；归档条目保留16px 4px内边距及25px行高；手机详情标题仍使用.detail-editorial的1.18行高和-0.035em字距。手机页脚源码虽然注释写“纵向”，实际flex-direction为row，本记录按实际声明。

当前 --gray-alpha-300 未定义，但复制按钮Hover边框引用了它；该声明无法解析，没有稳定的新边框色。本文保留这一现状，没有趁记录参数更改它。旧纹理CSS在注释中；现有部分测试使用源码正则并会匹配注释，因此测试通过不等于纹理启用。

## 8. 改色与复原方法

### 8.1 改色前后的最小操作范围

1. 先保存或提交本文件，保留下面的完整快照和Git基准。
2. 主要改 public/styles.css 的 :root 色值，随后检查2.3与2.4节的直接色值与notice局部变量。
3. 页面主底色改变时，同步 scripts/build.mjs 的 meta theme-color，原值 #fcf5e4。
4. 只改色时保留字号、宽度、间距、断点、图标及交互脚本。PNG与外部图标如需换色单独处理。
5. 改色后检查首页、归档、长文章及代码/Prompt/notice/音频，覆盖常态、Hover、键盘焦点、选中文字与减少动态状态。
6. 运行 npm test。当前 tests/site.test.mjs 有指定底色、组件色和theme-color的样式断言；设计有意改色时应同步对应预期，并保留结构和链接检查，不删除整组测试。

这次文档记录不会修改测试或任何视觉源文件；未来改色测试的预期调整由具体新设计决定。

### 8.2 仅恢复CSS

运行前确认 public/styles.css 中没有需要保留的新修改。此命令会把指定文件工作区内容替换成基准版本，不改变Git历史，也不恢复content中的文章。

~~~powershell
git diff -- public/styles.css
git restore --source=e6eefc62239e6980593ddf86c4a998857a4ea88f --worktree -- public/styles.css
npm test
~~~

若新CSS仍需留存，先复制另存或提交后再恢复。恢复后Get-FileHash结果应与附录B一致；不同换行符环境可按LF规范化后比较。

### 8.3 同时恢复浏览器主题色

浏览器主题色原值是 #fcf5e4。如果只改过该行，按本文件改回即可。scripts/build.mjs还承担文章列表和模板生成，若之后修改过其他功能，不要为了一行颜色整文件回滚。

完整组件结构/交互也要回到基线时，再对照基准提交中的scripts/build.mjs、scripts/markdown.mjs、public/toc.js、public/code-blocks.js、public/audio-player.js和public/math.js，逐文件检查差异。资源图标与字体校验见附录B。无需添加新的图片备份副本。

### 8.4 从文档快照恢复

附录C的CSS代码块是 public/styles.css 的完整内容，保留注释和规则顺序，可在Git基准不可用时复制代码块内部内容回源文件（不复制围栏）。保存为UTF-8、LF后按SHA-256检查。它是日期快照，不随以后设计自动更新。

不要直接修改 dist/client/styles.css。运行 npm test / npm run build 会重新复制CSS并按其SHA-256的前12位生成资源版本参数；此基线的assetVersion为88c2cec3146e。

## 附录 A：全部根变量

下表自动摘录有效 :root 声明，剔除注释。引用栏仅说明当前CSS是否出现var()引用，不代表每条引用一定会在当前页面显示。

| 变量 | 完整基准值 | 当前 CSS 引用 |
| --- | --- | --- |
| --background-100 | #fcf5e4 | 有 |
| --background-200 | rgba(29, 27, 27, 0.035) | 有 |
| --surface-raised | rgba(255, 252, 244, 0.82) | 有 |
| --surface-code | #f4ecda | 有 |
| --surface-code-toolbar | #e4dcc8 | 有 |
| --surface-prompt | var(--surface-code) | 有 |
| --surface-prompt-toolbar | var(--surface-code-toolbar) | 有 |
| --surface-react | #fffaf0 | 有 |
| --surface-hover | rgba(255, 252, 244, 0.94) | 无 |
| --border-code | #d5cdbb | 有 |
| --border-prompt | var(--border-code) | 有 |
| --border-react | #e4dcc8 | 有 |
| --paper-surface | none | 有 |
| --gray-1000 | #1d1b1b | 有 |
| --gray-900 | #56534f | 有 |
| --gray-800 | #6f6b66 | 有 |
| --gray-700 | #8a8680 | 有 |
| --gray-alpha-100 | rgba(29, 27, 27, 0.04) | 有 |
| --gray-alpha-200 | rgba(29, 27, 27, 0.07) | 有 |
| --gray-alpha-400 | rgba(29, 27, 27, 0.12) | 有 |
| --gray-alpha-500 | rgba(29, 27, 27, 0.21) | 有 |
| --gray-alpha-700 | rgba(29, 27, 27, 0.46) | 无 |
| --accent-100 | rgba(139, 69, 19, 0.08) | 有 |
| --accent-200 | rgba(139, 69, 19, 0.14) | 有 |
| --accent-700 | #8b4513 | 有 |
| --accent-800 | #8b4513 | 有 |
| --red-100 | #f9e8e5 | 无 |
| --red-800 | #833b37 | 有 |
| --amber-100 | #f4ead2 | 无 |
| --amber-800 | #8a5710 | 无 |
| --green-100 | #e4ede3 | 无 |
| --green-800 | #8b4513 | 无 |
| --blue-100 | #e3ebef | 无 |
| --blue-800 | #365f80 | 无 |
| --radius-sm | 6px | 有 |
| --radius-md | 12px | 有 |
| --radius-lg | 16px | 无 |
| --sans | "Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", "PingFang SC", "Microsoft YaHei", serif | 有 |
| --mono | "Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", serif | 有 |
| --code-font | "Geist Mono", "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif | 有 |
| --title-serif | "Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif | 有 |
| --serif | "Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif | 有 |
| --source-han-serif | "Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", "Source Han Serif CN", "Songti SC", SimSun, serif | 有 |
| --kai | "FandolKai", "Kaiti SC", STKaiti, KaiTi, "楷体", serif | 无 |
| --editorial | "Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif | 有 |
| --body-reading | "Times New Roman", "Noto Serif SC", "Source Han Serif SC", "Source Han Serif CN", "Songti SC", SimSun, serif | 有 |
| --body-kai | "Times New Roman", "FandolKai", "FandolKai TC", "Kaiti SC", "Kaiti TC", STKaiti, KaiTi, BiauKai, "DFKai-SB", "楷体", serif | 有 |
| --codex-ui-font | "OpenAI Sans", ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif | 有 |
| --page-width | 1040px | 有 |
| --article-width | 740px | 有 |

## 附录 B：源文件与资源指纹

以下是记录时本地文件的字节大小与SHA-256，不包含生成目录。完整页面恢复以基准Git提交为准，哈希用于验证源文件/资源是否变化。

| 文件 | bytes | SHA-256 |
| --- | --- | --- |
| public/styles.css | 47896 | 88c2cec3146e2df84651cb1bf37f855b71fc84e6dafc35811e5a0d690787df9e |
| scripts/build.mjs | 24810 | e131a69f24eb8284f61712b2549c3799de084f15c2ad633bced11b7b2fc55791 |
| scripts/markdown.mjs | 33778 | b4843974faef4973318e57e213cf6fdfab7d333635842a1b052acffd378eba54 |
| public/toc.js | 2782 | 0a6611a625718782718d8c31d5db3945376b6c547c536def11b21b4dedc4d7b7 |
| public/code-blocks.js | 1674 | dd46b0539756698cc4425722d2ff608f1408951de315e71aefbfea813ab39c80 |
| public/audio-player.js | 2595 | 2536456ad19c595ef1a1ee5c8c1b2ec559962ff4dc413cb600d4286e8470ce40 |
| public/math.js | 447 | 632f5043b75c8c1851d7444dc4097b39c6f33f1fced5ebaf18bab224e2a7a236 |
| public/brand-mark.png | 26463 | f3cc806d605d3aa9171052ebc0e23fcf89fae391d851f5f976bf8aed37e8ff95 |
| public/favicon.png | 3227 | af89bc60924c964358003fccd62debbe86f8a95a52aa10f7de108789c10b4b62 |
| public/og.png | 303245 | 481cd5bbae758763c7c481c0beea115a2d113f6f84e44cfde23732b79731db62 |
| public/fonts/AR-PL-KaitiM-Big5.woff2 | 4174492 | c5d79ee7baf038a8cab47268df05b97121c81fb3fbf7a6ece78db79032710f79 |

## 附录 C：完整CSS源码快照

这段源码保持原顺序。源码注释可能描述旧设计意图；当前生效参数以上文解析和有效声明为准。

<!-- CSS_SNAPSHOT_START -->
~~~css
/*
 * Huang 网站主样式表
 * --------------------------------------------------------------------------
 * 这是全站唯一需要手工维护的 CSS 源文件。构建后它会被复制到 dist/client，
 * 因此请只修改 public/styles.css，不要直接修改 dist/client/styles.css。
 *
 * 推荐阅读顺序：字体与变量 → 全局容器 → 导航 → 首页 → 内容列表 →
 * 文章与 Markdown → 翻页 → 响应式适配。
 * 初学者建议：颜色、字体和最大宽度优先在 :root 中统一调整。
 */

/* 字体资源：Geist Mono 用于日期、编号、代码和标签。 */
@font-face {
  font-family: "Geist Mono";
  src: url("https://cdn.jsdelivr.net/npm/geist@1.7.2/dist/fonts/geist-mono/GeistMono-Variable.woff2") format("woff2");
  font-display: swap;
  font-style: normal;
  font-weight: 100 900;
}

/* 正文引用使用网站早期的 FandolKai 字体资源，并优先复用设备自带楷体。 */
@font-face {
  font-family: "FandolKai";
  src:
    local("Kaiti"),
    local("Kaiti SC"),
    local("STKaiti"),
    local("楷体"),
    local("SimKai"),
    local("AR PL KaitiM GB"),
    local("DFKai-SB"),
    local("FandolKai"),
    url("https://cdn.jsdelivr.net/gh/residualsun1/infont/AR-PL-KaitiM-GB-from-yihui.woff2") format("woff2");
  font-display: swap;
  font-style: normal;
  font-weight: 400;
}

/* 繁体引用优先使用 iOS/macOS 的繁体楷体，其他设备回退到站内 Big5 楷体。 */
@font-face {
  font-family: "FandolKai TC";
  src:
    local("Kaiti TC"),
    local("BiauKai"),
    local("DFKai-SB"),
    local("AR PL KaitiM Big5"),
    url("/fonts/AR-PL-KaitiM-Big5.woff2") format("woff2");
  font-display: swap;
  font-style: normal;
  font-weight: 400;
}

/* 全局设计变量：统一管理颜色、字体、圆角和页面最大宽度。 */
:root {
  color-scheme: light;

  /*
   * 页面背景与半透明表面：
   * #fcf5e4 对应 Typewriter 的主内容纸面，#e4dcc8 对应其较深界面层。
   * Huang 没有侧栏，因此较深颜色只用于原本就存在的次级组件表面。
   */
  --background-100: #fcf5e4;
  --background-200: rgba(29, 27, 27, 0.035);
  --surface-raised: rgba(255, 252, 244, 0.82);
  --surface-code: #f4ecda;
  --surface-code-toolbar: #e4dcc8;
  --surface-prompt: var(--surface-code);
  --surface-prompt-toolbar: var(--surface-code-toolbar);
  --surface-react: #fffaf0;
  --surface-hover: rgba(255, 252, 244, 0.94);
  --border-code: #d5cdbb;
  --border-prompt: var(--border-code);
  --border-react: #e4dcc8;
  /*
   * 全站共用的纸张表面：
   * 不再使用大范围明暗光晕，三层微纹理均匀平铺，避免页面产生白黄渐变。
   * 深浅颗粒模拟纸浆纤维，极淡斜纹让磨砂表面更规整。
   */

  --paper-surface: none;

  /*
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
  */

  /* 从深到浅的正文、说明文字和弱化文字颜色。 */
  --gray-1000: #1d1b1b;
  --gray-900: #56534f;
  --gray-800: #6f6b66;
  --gray-700: #8a8680;
  --gray-alpha-100: rgba(29, 27, 27, 0.04);
  --gray-alpha-200: rgba(29, 27, 27, 0.07);
  --gray-alpha-400: rgba(29, 27, 27, 0.12);
  --gray-alpha-500: rgba(29, 27, 27, 0.21);
  --gray-alpha-700: rgba(29, 27, 27, 0.46);

  /* 棕色品牌色：用于链接、焦点、标签和交互状态。 */
  --accent-100: rgba(139, 69, 19, 0.08);
  --accent-200: rgba(139, 69, 19, 0.14);
  --accent-700: #8b4513;
  --accent-800: #8b4513;

  /* Markdown 提示框使用的错误、警告、成功和信息颜色。 */
  --red-100: #f9e8e5;
  --red-800: #833b37;
  --amber-100: #f4ead2;
  --amber-800: #8a5710;
  --green-100: #e4ede3;
  --green-800: #8b4513;
  --blue-100: #e3ebef;
  --blue-800: #365f80;

  /* 三档圆角：小组件、普通浮层和大型表面。 */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;

  /* 字体栈：浏览器会从左到右寻找可用字体。 */
  --sans: "Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", "PingFang SC", "Microsoft YaHei", serif;
  --mono: "Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", serif;
  --code-font: "Geist Mono", "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif;
  --title-serif: "Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif;
  --serif: "Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif;
  --source-han-serif: "Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", "Source Han Serif CN", "Songti SC", SimSun, serif;
  --kai: "FandolKai", "Kaiti SC", STKaiti, KaiTi, "楷体", serif;
  --editorial: "Libre Baskerville", Georgia, "Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif;
  /* 正文混排：英文字母与数字优先使用 Times New Roman，中文分别回退到宋体或楷体。 */
  --body-reading: "Times New Roman", "Noto Serif SC", "Source Han Serif SC", "Source Han Serif CN", "Songti SC", SimSun, serif;
  --body-kai: "Times New Roman", "FandolKai", "FandolKai TC", "Kaiti SC", "Kaiti TC", STKaiti, KaiTi, BiauKai, "DFKai-SB", "楷体", serif;
  /* Prompt / React 接近 Codex 界面的 UI 字体；系统没有 OpenAI Sans 时自动回退。 */
  --codex-ui-font: "OpenAI Sans", ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif;

  /* 布局宽度：首页最大 1040px，文章正文最大 740px。 */
  --page-width: 1040px;
  --article-width: 740px;
}

/* 基础重置：让元素的宽高包含 padding 与 border，尺寸更容易计算。 */
* { box-sizing: border-box; }

/* 仅供屏幕阅读器读取的文字：视觉隐藏，但保留无障碍语义。 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 页面根节点：设置背景、平滑滚动和锚点跳转的顶部预留。 */
html {
  background: var(--background-100);
  scroll-behavior: smooth;
  scroll-padding-top: 88px;
  /* 稳定手机和平板上的文字比例，同时保留浏览器缩放能力。 */
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

/* 全站正文基础样式；局部页面可以在后文覆盖这些值。 */
body {
  margin: 0;
  /*
   * 全站纸张质感背景：
   * 两层微粒和一层 8px 斜纹均匀平铺，不再制造局部白黄光晕；
   * 最后一层保留轻暖羊皮纸底色。
   */
  background: var(--paper-surface), var(--background-100);
  color: var(--gray-1000);
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
  /* 长篇正文交由浏览器平衡清晰度与性能，标题再单独加强字距渲染。 */
  text-rendering: auto;
}

/* 首页、归档页和全站导航使用更有出版感的衬线字体。 */
.site-header,
.site-footer,
.home .site-shell,
.listing .collection-shell {
  font-family: var(--editorial);
}

/* 用户选中文字时的高亮颜色。 */
::selection {
  background: var(--accent-200);
  color: var(--gray-1000);
}

/* 链接默认继承父元素颜色，具体样式由各组件定义。 */
a { color: inherit; }

/* 顶部导航：滚动时固定，并复用全站均匀的纸张颗粒与斜纹。 */
.site-header {
  position: sticky;
  z-index: 20;
  top: 0;
  background: var(--paper-surface), var(--background-100);
  backdrop-filter: none;
}

/* 全站通用水平容器：控制最大宽度与左右留白。 */
.site-header-inner,
.site-footer-inner,
.site-shell,
.article-shell,
.collection-shell {
  width: min(calc(100% - 48px), var(--page-width));
  margin-inline: auto;
}

/* 页眉只保留品牌图标；栏目导航已移动到首页右侧目录。 */
.site-header-inner {
  display: flex;
  min-height: 64px;
  align-items: center;
}

/* 左上角品牌入口与有机年轮图标。 */
.site-brand {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.brand-mark {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: contain;
}

/*
 * 仅为短标题启用更精细的字距渲染。
 * 这里没有重复声明字体、字号、字重、行高或字距，因此不会覆盖各组件原有视觉设置。
 */
.article-header h1,
.section-kicker,
.prose h1,
.prose h2,
.prose h3,
.prose h4 {
  font-kerning: normal;
  text-rendering: optimizeLegibility;
}

/* 首页使用与参考站接近的宽幅单列，让首屏更像完整的个人展示。 */
.home .site-header-inner,
.home .site-footer-inner,
.home-layout {
  width: min(calc(100% - 48px), 1020px);
}

/*
 * 首页品牌区改为随页面自然滚动的大号视觉锚点。
 * 仅首页取消粘性页眉，避免放大后的图标在滚动时长期占据内容空间。
 */
.home .site-header { position: static; }

.home .site-header-inner {
  min-height: 172px;
  padding-top: 82px;
}

.home .brand-mark {
  width: 90px;
  height: 90px;
}

.home-layout {
  padding-bottom: 112px;
}

/*
 * 首页首屏复刻参考站的展示节奏：介绍落在视口中后段，
 * 同时在首屏底部保留留白，让首个栏目在滚动后再进入视野。
 */
.hero {
  display: flex;
  min-height: max(620px, calc(100vh - 317px));
  min-height: max(620px, calc(100svh - 317px));
  padding: 0 0 76px;
  align-items: flex-end;
}

.hero-copy { width: 100%; }

/* 英文栏目编号和小标签统一使用 Libre Baskerville。 */
.section-kicker {
  margin: 0;
  color: var(--accent-700);
  font-family: var(--title-serif);
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0.08em;
}

/* 首页隐藏标题与文章大标题共用的基础字重和字距。 */
.hero h1,
.article-header h1 {
  margin: 16px 0 0;
  font-weight: 600;
  letter-spacing: -0.06em;
}

/* 项目、写作与阅读详情页的标题统一使用思源宋体体系。 */
.detail-editorial .article-header {
  border-bottom-color: var(--gray-alpha-400);
}

.detail-editorial .article-header h1 { font-family: var(--source-han-serif); }

.detail-editorial .article-header h1 {
  max-width: 820px;
  font-weight: 600;
  line-height: 1.18;
  letter-spacing: -0.035em;
}

/* 首页三段个人简介：统一使用首段的字号、颜色和字重。 */
.hero-intro {
  display: grid;
  max-width: 760px;
  gap: 24px;
  margin: 0;
  padding: 0;
  color: var(--gray-1000);
  font-family: "Times New Roman", Times, serif;
  font-size: 30px;
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: 0;
}

.hero-intro p { margin: 0; color: inherit; font-size: inherit; font-weight: inherit; }

/* 自我介绍下方的社交入口：小型单色图标、克制的文字下划线与圆点分隔。 */
.social-links {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 24px;
  color: rgb(79, 77, 74);
  font-family: var(--title-serif);
  font-size: 13px;
  line-height: 20px;
}

.social-links a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 7px;
  color: inherit;
  text-decoration: none;
  transition: color 200ms ease;
}

.social-links a span {
  border-bottom: 1px solid rgb(197, 193, 187);
  transition: border-color 200ms ease;
}

.social-links a:hover { color: rgb(29, 27, 27); }
.social-links a:hover span { border-bottom-color: rgb(29, 27, 27); }
.social-links svg { flex: 0 0 auto; }
.social-separator { color: var(--gray-alpha-500); }

/* 首页栏目通用间距；scroll-margin 避免锚点被顶部导航遮挡。 */
.content-section {
  padding-top: 15px;
  scroll-margin-top: 64px;
}

.home-layout > #projects { padding-top: 15px; }

/* 桌面端后续栏目保持充足的纵向呼吸空间；项目与自我介绍的距离保持不变。 */
@media (min-width: 601px) {
  .home-layout > .content-section + .content-section { padding-top: 48px; }
}

/* 栏目标题区域：编号与中文名称保持小字号，水平线从文字右侧延伸。 */
.section-heading {
  margin-bottom: 20px;
  padding-top: 48px;
}

.section-heading .section-kicker {
  display: flex;
  width: 100%;
  gap: 12px;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  white-space: nowrap;
}

.section-kicker__rail {
  position: relative;
  display: block;
  min-width: 0;
  height: 20px;
  flex: 1;
}

.section-kicker__rail::before {
  position: absolute;
  top: 50%;
  right: 0;
  left: 0;
  height: 1px;
  background: var(--gray-alpha-400);
  content: "";
}

.pin-badge {
  display: inline-flex;
  flex: 0 0 auto;
  height: 18px;
  padding: 0 7px;
  align-items: center;
  border: 1px solid var(--red-800);
  border-radius: 999px;
  background: var(--red-800);
  color: #fff;
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.pin-badge--writing-meta { display: none; }

.row-arrow {
  color: var(--gray-700);
  font-family: var(--mono);
  transition: color 150ms ease, transform 150ms cubic-bezier(0.175, 0.885, 0.32, 1.1);
}

/* 项目、写作与阅读共用的分隔式列表。 */
.writing-list {
  border-top: 1px solid var(--gray-alpha-400);
}

/* 单行结构：左侧日期、右侧标题摘要和箭头。 */
.writing-row {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr) 32px;
  gap: 24px;
  align-items: start;
  padding: 24px 12px;
  border-bottom: 1px solid var(--gray-alpha-400);
  color: inherit;
  text-decoration: none;
  transition: background-color 150ms ease;
}

.writing-row:hover { background: var(--gray-alpha-100); }

/* 列表日期。 */
.writing-meta {
  display: grid;
  min-width: 0;
  gap: 5px;
  align-content: start;
  justify-items: start;
}

.writing-row time {
  padding-top: 3px;
  color: var(--gray-700);
  font-family: var(--mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  line-height: 20px;
  text-align: left;
}

/* 标题和摘要组成的两行文字区域。 */
.writing-copy {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.writing-copy strong {
  display: flex;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  gap: 8px;
  align-items: center;
  color: var(--gray-1000);
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
  letter-spacing: -0.025em;
}

.writing-title-text {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.writing-copy > span {
  display: -webkit-box;
  overflow: hidden;
  max-width: 780px;
  color: var(--gray-900);
  font-size: 14px;
  line-height: 22px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* 首页用留白而非重复横线区分文章；加粗标题让棕色链接更稳定、醒目。 */
.home .writing-list { border-top: 0; }
.home .writing-row {
  /* 首页同一栏目内文章之间的距离：增减这个纵向内边距即可。 */
  padding-block: 17px;
  border-bottom: 0;
}
.home .writing-row:hover { background: transparent; }

.home .writing-copy strong {
  display: block;
  width: 100%;
  overflow: visible;
  justify-self: start;
  color: rgb(139, 69, 19);
  font-family: var(--title-serif);
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  /* 常态使用浅棕色下划线，悬浮时自然过渡为标题的深棕色。 */
}

.home .writing-title-text {
  display: inline;
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
  overflow-wrap: anywhere;
  text-decoration-color: rgb(190, 155, 128);
  text-decoration-style: solid;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.16em;
  transition: text-decoration-color 0.2s ease, text-decoration-thickness 0.2s ease;
}

.home .writing-copy .pin-badge--writing-title {
  margin-left: 8px;
  vertical-align: 0.12em;
}

.home .writing-row:hover .writing-title-text {
  text-decoration-color: rgb(139, 69, 19);
  text-decoration-line: underline;
  text-decoration-thickness: 1.5px;
}

/* 首页可选摘要来自 Markdown Front Matter 的 description；没有字段时不生成元素。 */
.home .writing-copy > span {
  /* 暖灰仍保持正文级对比度；英文字母使用 Times New Roman，中文沿用原宋体回退。 */
  color: #74685d;
  font-family: var(--body-reading);
  font-size: 13.8px;
  hyphens: auto;
  line-height: 23.5px;
  /* 窄屏禁用两端对齐，避免中英文换行时被强行拉出不自然的大间隔。 */
  text-align: left;
}

/* 悬浮时箭头向右移动，提示整行可以点击。 */
.writing-row:hover .row-arrow {
  color: var(--gray-1000);
  transform: translateX(3px);
}

/* 栏目右下角“所有文章 →”入口。 */
.section-more {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

/* 项目列表与其他栏目保持同一紧凑节奏。 */
.home #projects .section-more {
  margin-top: 18px;
}

.section-more a,
.collection-back {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  color: var(--gray-900);
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  text-decoration: none;
}

.section-more a span { transition: transform 150ms cubic-bezier(0.175, 0.885, 0.32, 1.1); }
.section-more a:hover span { transform: translateX(3px); }

/* 归档页统一采用更集中的阅读宽度。 */
.collection-shell {
  padding-bottom: 96px;
}

.listing .collection-shell {
  width: min(calc(100% - 48px), 760px);
}

/* 归档页标题区域。 */
.collection-header {
  padding: 64px 0 26px;
}

.collection-header h1 {
  margin: 10px 0 0;
  /* 与正文共用暖深灰，避免近黑色标题在羊皮纸背景上显得生硬。 */
  color: #34312f;
  font-family: var(--serif);
  font-size: clamp(32px, 5vw, 44px);
  /* 当前字体实际提供 400 / 700；使用真实 400 字重比模拟 300 更稳定。 */
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -0.02em;
}

/*
 * 文字归档只保留日期、标题和箭头：
 * 无摘要、无上下分隔线，以紧凑留白组织阅读顺序。
 */
.listing .writing-list {
  border-top: 0;
}

.listing .writing-row {
  padding: 16px 4px;
  border-bottom: 0;
}

.listing .writing-copy {
  gap: 0;
}

/* 归档条目标题使用正常字重和更松的字距，避免窄版面形成粗黑色块。 */
.listing .writing-copy strong {
  color: #34312f;
  font-size: 17px;
  font-weight: 400;
  line-height: 25px;
  letter-spacing: -0.01em;
}

.listing .writing-row:hover {
  background: transparent;
}

.collection-back { margin-top: 28px; }

/* 全站页脚：无分隔线，桌面端横向排列邮箱与年份。 */
.site-footer-inner {
  display: flex;
  min-height: 96px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  color: var(--gray-700);
  font-size: 12px;
  line-height: 16px;
}

.footer-email {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: rgb(79, 77, 74);
  font-family: var(--title-serif);
  font-size: 14px;
  text-decoration: none;
  transition: color 200ms ease;
}

.footer-email span {
  border-bottom: 1px solid rgb(197, 193, 187);
  transition: border-color 200ms ease;
}

.footer-email svg { flex: 0 0 auto; }
.footer-email:hover { color: rgb(29, 27, 27); }
.footer-email:hover span { border-bottom-color: rgb(29, 27, 27); }

.footer-meta {
  font-family: var(--title-serif);
  font-variant-numeric: tabular-nums;
}

/* 文章面包屑：“首页 / 写作”等路径提示。 */
.breadcrumb {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-top: 40px;
  color: var(--gray-700);
  font-size: 13px;
  line-height: 20px;
}

.breadcrumb a { text-decoration: none; }
.breadcrumb a:hover { color: var(--gray-1000); }

/* 文章标题区域：标题、作者、发布日期和文章标签。 */
.article-header {
  max-width: 920px;
  padding: 64px 0;
  border-bottom: 1px solid var(--gray-alpha-400);
}

.article-header h1 {
  max-width: 900px;
  margin: 0;
  font-size: clamp(38px, 5vw, 52px);
  line-height: 1.08;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 14px 24px;
  align-items: center;
  margin-top: 32px;
  color: var(--gray-700);
  font-family: var(--title-serif);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  line-height: 16px;
}

/* 作者和发布日期位于左侧，二者用细分隔符形成一组。 */
.article-byline {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.article-author {
  color: var(--gray-900);
}

.article-author::after {
  margin-left: 8px;
  color: var(--gray-alpha-500);
  content: "·";
}

.article-history {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.article-history-separator { color: var(--gray-alpha-500); }

/* 文章标签位于右侧；使用无序列表保留正确的语义结构。 */
.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
  margin: 0;
  padding: 0;
  list-style: none;
}

.article-tags li {
  display: inline-flex;
  min-height: 24px;
  align-items: center;
  padding: 4px 8px;
  border: 1px solid var(--gray-alpha-400);
  border-radius: 9999px;
  background: var(--gray-alpha-100);
}

/* 四个内容栏目均不在详情页显示摘要，因此缩短标题与元信息之间的距离。 */
.detail-editorial .article-meta { margin-top: 24px; }

/* 桌面端文章布局：左侧正文，右侧 220px 目录。 */
.article-layout {
  display: grid;
  grid-template-columns: minmax(0, var(--article-width)) 220px;
  gap: 80px;
  justify-content: center;
  align-items: start;
}

/* 正文主列：写作文章的上一篇/下一篇卡片放在这里，与正文精确对齐。 */
.article-main { min-width: 0; }

/* 文章目录固定在视口内；目录过长时鼠标滚轮只滚动目录本身。 */
.article-toc {
  position: sticky;
  top: 96px;
  overflow-y: auto;
  max-height: calc(100vh - 120px);
  margin-top: 64px;
  padding: 0 8px 8px 16px;
  border-left: 1px solid var(--gray-alpha-400);
  font-family: var(--body-reading);
  overscroll-behavior-y: contain;
  scrollbar-width: none;
}

.article-toc:focus-visible {
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  outline: 1px solid var(--gray-alpha-400);
  outline-offset: 4px;
}

/* 隐藏目录滚动条，但保留鼠标滚轮、触控板和键盘滚动。 */
.article-toc::-webkit-scrollbar { display: none; }

.article-toc > p {
  margin: 0 0 12px;
  color: var(--gray-1000);
  font-size: 14.5px;
  font-weight: 600;
  line-height: 22px;
}

.article-toc ol {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.article-toc li { min-width: 0; }
.article-toc .toc-level-3 { padding-left: 12px; }
.article-toc .toc-level-4 { padding-left: 24px; }

.article-toc a {
  display: block;
  overflow: hidden;
  color: var(--gray-700);
  font-size: 13.5px;
  line-height: 20px;
  text-decoration: none;
  text-overflow: ellipsis;
  transition: color 160ms ease;
  white-space: nowrap;
}

.article-toc a:hover,
.article-toc a[aria-current="location"] {
  color: var(--gray-1000);
}

/* Markdown 正文基础排版：字体、字号、行距和上下留白。 */
.prose {
  min-width: 0;
  margin: 64px 0 80px;
  color: #34312f;
  font-family: var(--body-reading);
  font-size: 15px;
  line-height: 1.75;
  overflow-wrap: anywhere;
}

/* 正文段落、强调和删除线。 */
.prose p { margin: 0 0 1.45em; }
.prose strong { color: var(--gray-1000); font-weight: 600; }
.prose del { color: var(--gray-700); }

/* 正文内部 h1–h6 的通用样式与锚点预留。 */
.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  scroll-margin-top: 96px;
  color: var(--gray-1000);
  font-family: var(--source-han-serif);
  font-weight: 600;
  letter-spacing: -0.035em;
}

.prose h1 { margin: 2.4em 0 0.9em; font-size: 36px; line-height: 44px; }
.prose h2 { margin: 2.5em 0 0.9em; font-size: 28px; line-height: 36px; }
.prose h3 { margin: 2.25em 0 0.75em; font-size: 22px; line-height: 30px; }
.prose h4 { margin: 2em 0 0.7em; font-size: 18px; line-height: 28px; }
.prose h5,
.prose h6 { margin: 1.8em 0 0.6em; font-size: 16px; line-height: 24px; }

/* 有序列表、无序列表及列表项。 */
.prose ul,
.prose ol {
  margin: 0 0 1.5em;
  padding-left: 1.5em;
}

.prose li { margin: 0.45em 0; padding-left: 0.15em; }
.prose li::marker { color: var(--gray-700); }

/* 多级列表：子层级缩进并使用不同项目符号，层级关系更容易辨认。 */
.prose li > ul,
.prose li > ol {
  margin: 0.45em 0 0.3em;
  padding-left: 1.55em;
}

.prose ul ul { list-style-type: circle; }
.prose ul ul ul { list-style-type: square; }

/* 默认 Markdown 引用：楷体、棕色左边线和淡色背景。 */
.prose blockquote {
  margin: 2em 0;
  padding: 16px 20px;
  border-left: 3px solid var(--accent-700);
  background: var(--accent-100);
  color: var(--gray-900);
  font-family: var(--body-kai);
  font-size: 17px;
  font-style: normal;
  line-height: 1.9;
}

.prose blockquote > :last-child { margin-bottom: 0; }

/* 项目、写作与阅读共用的正文排版；margin-top 控制正文与上方分隔线的距离。 */
.detail-editorial .prose {
  margin-top: 40px;
  margin-bottom: 50px;
  color: #34312f;
  font-size: 15.5px;
  line-height: 1.75;
  letter-spacing: 0.01em;
}

/* 四个内容栏目共用的引用样式：保留楷体和左边线，移除底色。 */
.detail-editorial .prose blockquote {
  margin: 2.5em 1.25em;
  padding: 0.2em 0 0.2em 1.35em;
  border-left: 1px solid var(--accent-700);
  background: transparent;
  color: var(--gray-900);
  font-size: 17px;
  line-height: 1.88;
}

/* 列表项中的引用属于当前序列内容，收紧外边距以保持层级连续。 */
.detail-editorial .prose li > blockquote { margin: 0.85em 0 0.65em; }

/* 行内代码：正文中的短命令、变量名和文件名。 */
.prose code {
  padding: 0.15em 0.38em;
  border: 1px solid var(--gray-alpha-200);
  border-radius: 4px;
  background: var(--gray-alpha-100);
  color: var(--gray-1000);
  font-family: var(--code-font);
  font-size: 0.84em;
}

/* 代码块外壳：轻微环境阴影只建立层次，不制造悬浮卡片感。 */
.code-block {
  overflow: hidden;
  margin: 2em 0;
  border: 1px solid var(--border-code);
  border-radius: 12px;
  background: var(--surface-code);
  box-shadow: 0 14px 34px rgba(64, 54, 42, 0.055), 0 2px 7px rgba(64, 54, 42, 0.035);
}

/* 顶部工具栏：左侧为文件名或代码类型，右侧只保留复制操作。 */
.code-toolbar {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 3px 10px 3px 14px;
  border-bottom: 1px solid var(--border-code);
  background: var(--surface-code-toolbar);
}

/* 工具栏左右两组保持稳定对齐，不包含参考页面中的三色圆点。 */
.code-toolbar .toolbar-left,
.code-toolbar .toolbar-right {
  display: flex;
  min-width: 0;
  align-items: center;
}

.code-toolbar .toolbar-right { flex: 0 0 auto; }

/* 标签与代码正文共享技术型无衬线栈；中文不会回退到正文的宋体。 */
.toolbar-label {
  overflow: hidden;
  color: #595959;
  font-family: var(--code-font);
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 多行代码正文：暖灰纸面与站点背景自然过渡，同时支持横向与纵向滚动。 */
.prose pre {
  overflow: auto;
  max-height: min(70vh, 720px);
  margin: 0;
  padding: 22px;
  border: 0;
  border-radius: 0;
  background: var(--surface-code);
  color: #403c37;
  font-family: var(--code-font);
  font-size: 14px;
  line-height: 1.7;
  tab-size: 2;
}

/* 复制按钮：完全采用文章指定的 inline-prompt-copy-btn 与 15px SVG。 */
.inline-prompt-copy-btn {
  flex: 0 0 auto;
  display: grid;
  width: 34px;
  min-width: 34px;
  height: 34px;
  place-items: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #595959;
  cursor: pointer;
  transition: border-color 150ms ease, color 150ms ease, background-color 150ms ease;
}

.inline-prompt-copy-btn:hover {
  border-color: var(--gray-alpha-300);
  background: var(--surface-react);
  color: var(--gray-1000);
}

.inline-prompt-copy-btn.is-copied { color: var(--accent-800); }

/* SVG 保持源码指定尺寸；复制成功后隐藏 path，只留下 rect 单方框。 */
.inline-prompt-copy-btn svg {
  display: block;
  overflow: visible;
}

.inline-prompt-copy-btn svg path {
  transform-box: fill-box;
  transform-origin: center;
  transition: opacity 180ms ease, transform 180ms ease;
}

.inline-prompt-copy-btn.is-copied svg path {
  opacity: 0;
  transform: translate(-3px, 3px) scale(0.82);
}

/* Prompt 专用展示：直接复用代码块纸面、顶栏与边框配色，保持同一视觉体系。 */
.prompt-block {
  overflow: hidden;
  margin: 1.7em 0;
  border: 1px solid var(--border-prompt);
  border-radius: 12px;
  background: var(--surface-prompt);
  box-shadow: 0 4px 14px rgba(75, 58, 40, 0.045);
}

/* Prompt 顶栏：左侧是内容类型，右侧是仅保留图标的复制按钮。 */
.prompt-toolbar {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 5px 12px 5px 16px;
  border-bottom: 1px solid var(--border-prompt);
  background: var(--surface-prompt-toolbar);
}

.prompt-heading {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--gray-1000);
  font-family: var(--codex-ui-font);
  font-size: 14px;
  font-weight: 650;
  letter-spacing: 0.055em;
}

.prompt-mark {
  display: inline-grid;
  place-items: center;
}

.prompt-mark svg { display: block; }

/* 模型图标只在 React 指定 GPT、Claude 或 Gemini 时显示。 */
.prompt-model-icon {
  display: block;
  width: 17px;
  height: 17px;
  object-fit: contain;
}

/* Prompt / React 正文使用接近 Codex 的无衬线 UI 字体，并保留输入段落与换行。 */
.prompt-content {
  padding: 13px 20px 16px;
  color: #302d29;
  font-family: var(--codex-ui-font);
  font-size: 15.5px;
  line-height: 1.8;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

/* React 表示 AI 输出：移除生硬外框，以白色纸片和极轻投影形成层次。 */
.react-block {
  border: 0;
  background: var(--surface-react);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.react-block .prompt-toolbar {
  border-bottom-color: var(--border-react);
  background: transparent;
}

.react-block .prompt-content { color: #34312f; }

.prose pre code {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
}

/* 长公式在窄屏中横向滚动，避免撑破正文栏。 */
.prose .katex-display {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.2em 0;
}

/* 构建阶段生成的语法高亮色：在暖灰纸面上增加色相区分，同时避免高饱和刺眼感。 */
.token-comment { color: #716b64; font-style: italic; }
.token-keyword,
.token-tag { color: #98482f; font-weight: 600; }
.token-string { color: #3f7156; }
.token-property { color: #6b528c; }
.token-number,
.token-constant { color: #a04f42; }

/* 正文链接及悬浮下划线颜色。 */
.prose a {
  color: var(--accent-800);
  text-decoration-color: rgb(190, 155, 128);
  text-underline-offset: 4px;
  transition: text-decoration-color 150ms ease;
}

.prose a:hover { text-decoration-color: var(--accent-700); }

/* Markdown 中显式使用 <u> 时，保持跨浏览器一致的正文下划线。 */
.prose u {
  text-decoration-line: underline;
  text-decoration-color: currentColor;
  text-decoration-style: solid;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.16em;
}

/* Markdown 水平分隔线。 */
.prose hr {
  height: 1px;
  margin: 64px 0;
  border: 0;
  background: var(--gray-alpha-400);
}

/* 正文图片保持原始比例，并使用与站点一致的小圆角。 */
.prose img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
}

/* 单张 Markdown 图片的外边距和居中方式。 */
.markdown-image { margin: 2.5em 0; }
.markdown-image img { margin-inline: auto; }

/* 图片与多图画廊共用的图注样式。 */
.markdown-image figcaption,
.image-loop figcaption {
  margin-top: 10px;
  color: var(--gray-700);
  font-family: var(--mono);
  font-size: 12px;
  line-height: 16px;
  text-align: center;
}

/* 表格外层：小屏幕时允许横向滚动。 */
.table-scroll {
  overflow-x: auto;
  max-width: 100%;
  margin: 2em 0;
  border: 1px solid var(--gray-alpha-400);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
}

/* 表格本体与单元格边框、内边距。 */
.prose table {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 20px;
}

.prose th,
.prose td {
  padding: 12px 14px;
  border-right: 1px solid var(--gray-alpha-400);
  border-bottom: 1px solid var(--gray-alpha-400);
  vertical-align: top;
}

.prose th:last-child,
.prose td:last-child { border-right: 0; }
.prose tr:last-child td { border-bottom: 0; }

.prose th {
  background: var(--background-200);
  color: var(--gray-1000);
  font-size: 13px;
  font-weight: 600;
}

/* Hugo notice 提示框：低饱和语义色、纸张纹理和克制的编辑式边框。 */
.notice-box {
  --notice-surface: #ebe4d9;
  --notice-border: rgba(106, 85, 65, 0.26);
  --notice-accent: #79583f;

  min-inline-size: 0;
  max-width: 100%;
  margin: 2em 0;
  padding: 0;
  border: 1px solid var(--notice-border);
  border-left: 3px solid var(--notice-accent);
  border-radius: 10px;
  background: var(--paper-surface), var(--notice-surface);
}

/* 标题只保留文字，不再使用胶囊背景或描边。 */
.notice-box legend {
  margin-left: 18px;
  padding: 0 7px 0 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--notice-accent);
  font-family: var(--source-han-serif);
  font-size: 15px;
  font-weight: 700;
  line-height: 21px;
  letter-spacing: 0.04em;
}

/* 内容留出稳定呼吸空间；底色由提示框承担并与纹理共同平铺。 */
.notice-body {
  min-width: 0;
  padding: 16px 20px 5px;
}

.notice-content {
  --notice-surface: #ebe4d9;
  --notice-border: rgba(106, 85, 65, 0.26);
  --notice-accent: #79583f;
}

.notice-warning {
  --notice-surface: #f0e5cf;
  --notice-border: rgba(144, 94, 34, 0.3);
  --notice-accent: #8a571c;
}

.notice-info {
  --notice-surface: #e2e9e5;
  --notice-border: rgba(62, 99, 96, 0.28);
  --notice-accent: #3f6664;
}

.notice-success {
  --notice-surface: #e4e9dc;
  --notice-border: rgba(81, 107, 72, 0.28);
  --notice-accent: #536f49;
}

.notice-danger {
  --notice-surface: #eee0db;
  --notice-border: rgba(135, 70, 58, 0.28);
  --notice-accent: #884a3e;
}

/* 可折叠 details / summary，用于隐藏较长代码或补充说明。 */
.prose details {
  margin: 2em 0;
  padding: 16px 18px;
  border: 1px solid var(--gray-alpha-400);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
}

.prose summary {
  cursor: pointer;
  color: var(--gray-1000);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.prose details[open] summary { margin-bottom: 16px; }

/* 键盘按键 kbd 的立体按键外观。 */
.prose kbd {
  display: inline-block;
  min-width: 1.75em;
  padding: 1px 6px;
  border: 1px solid var(--gray-alpha-500);
  border-bottom-width: 2px;
  border-radius: 4px;
  background: var(--surface-raised);
  color: var(--gray-1000);
  font-family: var(--code-font);
  font-size: 0.75em;
  line-height: 1.45;
  text-align: center;
  white-space: nowrap;
}

/* 文本高亮 mark、居中工具类与任务清单。 */
.prose mark {
  padding: 0.04em 0.2em;
  background: #e8dca7;
  color: inherit;
}

.text-center { text-align: center; }
.task-list-item { list-style: none; }
.task-list-item input { margin-right: 8px; accent-color: var(--accent-700); }

/* Markdown 脚注编号。 */
.footnote-ref {
  margin-left: 2px;
  font-family: "Times New Roman", serif;
  font-size: 0.72em;
}

.footnote-ref a { text-decoration: none; }

/* 脚注正文和返回正文的链接。 */
.footnotes {
  margin-top: 64px;
  color: var(--gray-900);
  font-family: var(--body-reading);
  font-size: 14px;
  line-height: 24px;
}

.footnotes hr { margin: 0 0 24px; }
.footnotes ol {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.footnotes li {
  position: relative;
  padding-left: 34px;
}

.footnote-number {
  position: absolute;
  left: 0;
  color: var(--accent-800);
  font-family: "Times New Roman", serif;
}
.footnote-backref {
  margin-left: 4px;
  color: var(--accent-800);
  font-family: "Times New Roman", Georgia, serif;
  font-variant-emoji: text;
  text-decoration: none !important;
  white-space: nowrap;
}

/* Hugo imgloop 兼容：可以横向滚动的多图画廊。 */
.image-loop {
  display: grid;
  grid-auto-columns: min(84%, 640px);
  grid-auto-flow: column;
  gap: 16px;
  overflow-x: auto;
  margin: 2em 0;
  padding: 0 0 12px;
  scroll-snap-type: x mandatory;
  scrollbar-color: var(--gray-alpha-500) transparent;
}

.image-loop figure {
  margin: 0;
  scroll-snap-align: start;
}

.image-loop img {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: contain;
  background: var(--background-200);
}

/* 文章级音频：APlayer 负责渐进增强，原生 audio 在脚本不可用时保底。 */
.audio-embed {
  max-width: 100%;
  margin: 2.25em 0;
}

.audio-player-mount:empty { display: none; }

.audio-embed meting-js { display: block; }

.audio-native-fallback {
  display: block;
  width: 100%;
  min-height: 54px;
}

.audio-native-fallback[hidden] { display: none; }

.prose .audio-meting-status {
  margin: 0;
  padding: 14px 16px;
  border: 1px solid var(--gray-alpha-400);
  border-radius: var(--radius-md);
  background: var(--paper-surface), var(--surface-raised);
  color: var(--gray-800);
  font-family: var(--body-reading);
  font-size: 13px;
  line-height: 22px;
}

.audio-meting-status[hidden] { display: none; }

.audio-embed-meting.has-audio-error .audio-meting-status {
  border-style: dashed;
  color: var(--gray-900);
}

.audio-embed .aplayer {
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--gray-alpha-400);
  border-radius: var(--radius-md);
  background: var(--paper-surface), var(--surface-raised);
  box-shadow: 0 8px 24px rgba(64, 49, 34, 0.06);
  color: var(--gray-1000);
  font-family: var(--body-reading);
}

.audio-embed .aplayer .aplayer-pic {
  background-color: #ded5c8;
}

.audio-embed .aplayer .aplayer-info .aplayer-music .aplayer-title {
  color: var(--gray-1000);
  font-family: var(--source-han-serif);
  font-size: 14px;
  font-weight: 600;
}

.audio-embed .aplayer .aplayer-info .aplayer-music .aplayer-author,
.audio-embed .aplayer .aplayer-info .aplayer-controller .aplayer-time {
  color: var(--gray-800);
}

.audio-embed .aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap .aplayer-bar {
  background: var(--gray-alpha-400);
}

.audio-embed .aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap .aplayer-bar .aplayer-loaded {
  background: var(--gray-alpha-500);
}

.audio-embed .aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap .aplayer-bar .aplayer-played,
.audio-embed .aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap .aplayer-bar .aplayer-played .aplayer-thumb,
.audio-embed .aplayer .aplayer-info .aplayer-controller .aplayer-volume-wrap .aplayer-volume-bar-wrap .aplayer-volume-bar .aplayer-volume {
  background: var(--accent-700) !important;
}

.audio-embed .aplayer .aplayer-info .aplayer-controller .aplayer-time .aplayer-icon path {
  fill: var(--gray-900);
}

.audio-embed .aplayer .aplayer-lrc::before,
.audio-embed .aplayer .aplayer-lrc::after {
  display: none;
}

.audio-embed .aplayer .aplayer-lrc p {
  color: var(--gray-800);
  font-family: var(--body-reading);
}

.audio-embed .aplayer .aplayer-lrc p.aplayer-lrc-current {
  color: var(--gray-1000);
  font-weight: 600;
}

.audio-caption {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: baseline;
  margin-top: 9px;
  color: var(--gray-700);
  font-family: var(--body-reading);
  font-size: 12.5px;
  line-height: 19px;
}

.audio-caption-title {
  color: var(--gray-900);
  font-weight: 600;
}

.audio-source-link { margin-left: auto; }

/* 播放器成功后由 APlayer 展示曲名和艺术家，图注只保留外部来源入口。 */
.audio-embed.is-enhanced .audio-caption-title,
.audio-embed.is-enhanced .audio-caption-artist {
  display: none;
}

.audio-embed.is-enhanced .audio-caption:not(.has-source-link) {
  display: none;
}

.audio-embed.is-enhanced .audio-caption.has-source-link {
  justify-content: flex-end;
}

/* 未识别的旧 Hugo 格式：用红色虚线框提醒开发者继续处理。 */
.unsupported-format {
  display: grid;
  gap: 8px;
  margin: 2em 0;
  padding: 16px;
  border: 1px dashed var(--red-800);
  border-radius: var(--radius-sm);
  color: var(--red-800);
  font-family: var(--code-font);
  font-size: 12px;
}

.unsupported-format code { overflow-wrap: anywhere; }

/* 文章上一篇 / 下一篇与返回首页入口共同占满正文主列。 */
.article-pagination,
.article-footer {
  width: 100%;
}

/* 默认上一篇 / 下一篇使用两列卡片。 */
.article-pagination {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid var(--gray-alpha-400);
}

/* 单个翻页卡片的布局、表面和交互动画。 */
.article-pagination-item {
  display: grid;
  min-width: 0;
  min-height: 112px;
  align-content: space-between;
  gap: 18px;
  padding: 18px;
  border: 1px solid var(--gray-alpha-400);
  border-radius: var(--radius-sm);
  background: var(--paper-surface), var(--background-100);
  color: var(--gray-900);
  text-decoration: none;
  transition: border-color 150ms ease, transform 150ms ease;
}

.article-pagination-item.next { text-align: right; }

.article-pagination-item > span {
  color: var(--gray-700);
  font-size: 12px;
  line-height: 18px;
}

.article-pagination-item strong {
  overflow: hidden;
  color: var(--gray-1000);
  font-family: var(--source-han-serif);
  font-size: 15px;
  font-weight: 500;
  line-height: 23px;
  text-overflow: ellipsis;
}

a.article-pagination-item:hover {
  border-color: var(--gray-alpha-500);
  background: var(--paper-surface), #f7f0de;
  transform: translateY(-2px);
}

.article-pagination-item.is-disabled {
  opacity: 0.46;
}

/* 四个内容栏目均把翻页卡片放入正文列，并删除卡片上方的分隔线。 */
.detail-editorial .article-pagination {
  padding-top: 0;
  border-top: 0;
}

/* 文章末尾“回到首页”入口位于 article-main 内，与正文最左边缘对齐。 */
.article-footer {
  margin: 24px 0 96px;
}

.article-footer a {
  color: var(--gray-900);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
}

.article-footer a:hover { color: var(--gray-1000); }

/* 键盘操作时显示统一焦点环。 */
:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 2px var(--background-100), 0 0 0 4px var(--accent-700);
}

@media (max-width: 960px) {
  .article-layout {
    display: block;
    width: min(100%, var(--article-width));
    margin-inline: auto;
  }

  .article-toc { display: none; }
}

/* 手机适配（≤ 600px）：三个栏目共用紧凑的日期、文字与箭头三列。 */
@media (max-width: 600px) {
  /* 手机端全站左右边距由 48px 总留白缩小为 32px。 */
  .site-header-inner,
  .site-footer-inner,
  .site-shell,
  .article-shell,
  .collection-shell {
    width: min(calc(100% - 32px), var(--page-width));
  }

  .listing .collection-shell {
    width: min(calc(100% - 32px), 760px);
  }

  /* 手机端首页品牌标记保持 90px，并与参考站一样贴近页面左上区域。 */
  .site-header-inner { min-height: 56px; }
  .brand-mark { width: 36px; height: 36px; }
  .home .site-header-inner { min-height: 114px; padding-top: 24px; }
  .home .brand-mark { width: 90px; height: 90px; }

  .home-layout {
    width: min(calc(100% - 40px), 1020px);
  }

  /* 手机端由完整首屏承载个人介绍，栏目在下一次滚动时自然进入。 */
  .hero {
    min-height: max(580px, calc(100vh - 109px));
    min-height: max(580px, calc(100svh - 109px));
    padding: 0 0 36px;
  }

  .hero-intro { gap: 24px; font-size: 30px; line-height: 1.3; }

  .social-links { margin-top: 24px; }

  /* 手机端首页栏目与内容列表。 */
  .content-section { padding-top: 48px; }

  .section-heading {
    margin-bottom: 16px;
    padding-top: 16px;
  }

  .section-heading .section-kicker { gap: 10px; }

  .pin-badge { height: 17px; padding-inline: 6px; font-size: 9.5px; }

  .home .pin-badge--writing-title { display: none; }

  .home .writing-meta {
    width: max-content;
    justify-items: center;
  }

  .home .pin-badge--writing-meta {
    display: inline-flex;
    margin-top: 3px;
  }

  .writing-row {
    grid-template-columns: 82px minmax(0, 1fr) 20px;
    gap: 10px;
    padding: 20px 8px;
  }

  .home .writing-row { padding-block: 20px; }

  .writing-copy strong { font-size: 17px; line-height: 24px; }

  /* 手机端页脚改成纵向排列。 */
  .site-footer-inner {
    min-height: 88px;
    align-items: flex-start;
    flex-direction: row;
    justify-content: space-between;
    gap: 8px;
  }

  .breadcrumb { padding-top: 24px; }

  /* 手机端文章标题和元信息。 */
  .article-header { padding: 48px 0; }
  .article-header h1 { font-size: 36px; line-height: 41px; letter-spacing: -0.045em; }
  .article-meta { align-items: flex-start; flex-direction: column; }
  .article-tags { justify-content: flex-start; }

  /* 手机端 Markdown 正文与扩展组件。 */
  .prose {
    margin-top: 48px;
    font-size: 16px;
    line-height: 1.9;
  }

  .prose h1 { font-size: 30px; line-height: 38px; }
  .prose h2 { font-size: 26px; line-height: 34px; }
  .prose h3 { font-size: 21px; line-height: 29px; }
  .prose h4 { font-size: 18px; line-height: 27px; }
  .code-block { margin-inline: -8px; border-radius: 10px; }
  .code-toolbar { min-height: 38px; padding: 2px 8px 2px 12px; }
  .prose pre { padding: 18px 16px; font-size: 13px; }
  .prompt-toolbar { min-height: 42px; padding: 4px 10px 4px 14px; }
  .prompt-content { padding: 12px 16px 14px; font-size: 15px; }
  .prose blockquote { margin-inline: -8px; }
  .notice-box { margin-inline: 0; }
  .image-loop { grid-auto-columns: 92%; }
  .audio-embed { margin-block: 2em; }
  .audio-caption { gap: 3px 8px; }
  .audio-source-link { margin-left: 0; }

  /* 手机端上下篇导航改为单列。 */
  .article-pagination { grid-template-columns: 1fr; }
  .article-pagination-item { min-height: 104px; }
  .article-footer { margin-bottom: 72px; }

  .collection-header { padding: 52px 0 24px; }

  /* 手机端四个内容栏目的统一字体、段落和楷体引用。 */
  .detail-editorial .prose {
    margin-top: 48px;
    font-size: 16px;
    line-height: 1.76;
    letter-spacing: 0.005em;
  }

  .detail-editorial .prose > p { margin-bottom: 2em; }

  .detail-editorial .prose blockquote {
    margin-inline: 0;
    padding-left: 1.1em;
    font-size: 16px;
  }

  .detail-editorial .article-pagination { gap: 12px; }
}

/* 用户开启“减少动态效果”时，关闭滚动和界面过渡。 */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { transition: none !important; }
  .audio-embed .aplayer-loading-icon svg { animation: none !important; }
}
~~~
<!-- CSS_SNAPSHOT_END -->
