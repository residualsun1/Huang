# Obsidian Typewriter 色板迁移 Design QA

## Comparison target

- Source visual truth: `C:\Users\Sonde\AppData\Local\Temp\codex-clipboard-f29ecb95-d8bb-40eb-b7ff-ce1a101bfa87.png` (2880 × 1706 px, RGBA 且全图 alpha 为 255；对应约 1440 × 853 CSS px 的 2x 截图)。
- Source palette: 主内容 `#fcf5e4`；左右侧栏 `#e4dcc8`；正文 `#1d1b1b`；内部链接 `#8b4513`。
- Requested scope: 只迁移颜色；不改字体、字号、行高、间距、布局、噪点、斜纹、圆角、阴影结构或交互。

## Implementation evidence

- Final desktop home: `D:\03_Project\Huang\output\design-qa\obsidian-color\07-final-home.png` (1425 × 844 px)，浏览器 CSS viewport 为 1440 × 853，device pixel ratio 为 2；浏览器截图排除了滚动条区域。
- Final article surface check: `D:\03_Project\Huang\output\design-qa\obsidian-color\06-final-article-surfaces.png` (1425 × 844 px)，同一桌面 viewport，文章滚动位置 `scrollY = 1350`。
- Final mobile home: `D:\03_Project\Huang\output\design-qa\obsidian-color\04-after-mobile-home.png` (375 × 812 px)，CSS viewport 为 390 × 844，device pixel ratio 为 1；浏览器截图排除了滚动条区域。
- Normalized full-view comparison: `D:\03_Project\Huang\output\design-qa\obsidian-color\05-comparison-home.png` (2850 × 844 px)。源图先按 50% 缩至 1440 × 853，再裁去右侧 15 px 与底部 9 px，与最终实现的 1425 × 844 浏览器内容截图并排。
- State: light theme；首页顶部；文章截图展示代码块与目录。

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: passed. CSS 差异未修改任何字体族、字号、字重、行高、字距或文字渲染属性；桌面与移动截图中的原有换行和层级保持不变。
- Spacing and layout rhythm: passed. 未修改尺寸、边距、内边距、网格、圆角或阴影结构；桌面与移动端均无水平溢出。
- Colors and visual tokens: passed. 首页计算背景为 `rgb(252, 245, 228)`，与 Typewriter 主内容色 `#fcf5e4` 完全一致；浏览器 `theme-color` 同步为 `#fcf5e4`。Typewriter 次级色 `#e4dcc8` 映射到已有的代码/Prompt 顶栏，没有新增侧栏或改变布局。代码正文使用中间暖色 `#f4ecda`，React 表面使用 `#fffaf0`。
- Foreground contrast: passed. 主文字 `#1d1b1b` 对主背景为 15.77:1；棕色链接 `#8b4513` 为 6.53:1；代码工具栏标签已调整为 `#595959`，对 `#e4dcc8` 为 5.13:1。
- Image quality and asset fidelity: passed. 品牌 PNG 未修改，桌面和移动截图中仍清晰；没有新增或替换任何图像资产。
- Copy and content: passed. 页面文字、导航标签与文章内容未修改。
- Browser behavior: passed. 已验证文章至首页的站内导航；浏览器控制台无 error 或 warning。

## Focused-region comparison

- `06-final-article-surfaces.png` 单独检查了次级色的实际使用：代码顶栏计算色为 `#e4dcc8`，标签为 `#595959`，代码正文为 `#f4ecda`，正文代码色为 `#403c37`。
- 纹理无需另做像素级“匹配”修复：源截图的两块大面积底色是纯色，而 Huang 按用户要求继续叠加原有 `--paper-surface`。这是明确保留的产品约束，不是设计漂移。

## Comparison history

1. Baseline `01-before-home.png` 的页面底色为 `#f2ede3`，比 Typewriter 主内容区更灰、更暗。
2. 将主纸面改为 `#fcf5e4`，把 `#e4dcc8` 映射到原有次级组件表面，并同步代码、Prompt、React、边框、Hover、选择态和浏览器主题色。
3. [P2] 初次次级表面检查发现旧的代码工具栏标签 `#69645e` 对 `#e4dcc8` 仅 4.29:1。
4. 将工具栏标签与复制按钮改为截图侧栏正文同色 `#595959`；最终计算对比度为 5.13:1，`06-final-article-surfaces.png` 确认层级清晰。
5. `npm test` 通过全部 40 项测试；最终桌面、移动端与文章截图均无水平溢出或控制台错误。

## Follow-up polish

- 唯一保留差异是 Huang 原有噪点和斜纹；用户可在 `--paper-surface` 中手动调节或移除。该差异属于明确要求保留的可选纹理，不阻塞当前颜色迁移。

final result: passed

## 2026-11-14 Residualsun 题头与正文导航

- 参考为用户提供的 Savage Minds 首页和正文截图 `codex-clipboard-26b602ca-75a2-43dd-80ed-b3f829ec9628.png`、`codex-clipboard-d799a98b-dc02-4e3a-9612-5e74586dd356.png`。原图为 2880 × 354 和 2880 × 600，按 50% 换算至 CSS 像素。对照时对齐题头分隔线，补齐正文参考截图顶部的裁切。
- 在 1440 × 850 CSS 像素下用内置浏览器抓取首页和正文顶部，截图为 1440 × 177 和 1440 × 300。`residualsun-reference-comparison.jpg` 将参考与实现并排，核对题头、导航、分隔线和正文起点。截图存放于 `C:/Users/Sonde/.codex/visualizations/2026/11/14/01a1d95a-08fd-7b81-97dd-405688641b92/`。
- 桌面首页和正文题头均为 108 CSS 像素，54 像素 Libre Baskerville 字标的坐标和边界一致。首页的 49 像素导航承载原有的首页、归档和关于，正文从题头下方开始。实测 390 像素宽的首页和正文均为 72 像素题头与 32 像素字标，320 像素宽的首页导航可完整显示。
- 页面沿用 Residualsun 的黑白配色、字体和内容。字标使用文字渲染，图片仍来自站点现有素材。
- 已在内置浏览器验证首页封面进入正文、点击正文题头返回首页。控制台未记录错误，`npm test` 通过 35 项。

final result: passed
