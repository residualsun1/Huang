# 首页全屏个人展示 Design QA

## Comparison target

- Live reference: `https://divyasiddarth.com/`
- Desktop source capture: `D:\03_Project\Huang\output\source-capture\divyasiddarth\01-desktop-top.png`
- Mobile source capture supplied by the user: `C:\Users\Sonde\AppData\Local\Temp\codex-clipboard-3cd1dd7a-6b35-48c5-bfa2-f4a24cc5fab9.jpg`
- Target state: the first viewport is a complete personal introduction; the first content section starts at the lower edge of the viewport and becomes the focus after one natural downward scroll.
- Existing Huang content, paper texture, serif type, social links, section dividers, and section data remain the product source of truth.

## Evidence

- Desktop implementation: `D:\03_Project\Huang\output\design-qa\home-fullscreen\01-implementation-desktop.png`
- Mobile implementation: `D:\03_Project\Huang\output\design-qa\home-fullscreen\02-implementation-mobile.png`
- Scrolled desktop implementation: `D:\03_Project\Huang\output\design-qa\home-fullscreen\03-implementation-scrolled.png`
- Desktop combined comparison: `D:\03_Project\Huang\output\design-qa\home-fullscreen\04-comparison-desktop.png`
- Mobile combined comparison: `D:\03_Project\Huang\output\design-qa\home-fullscreen\05-comparison-mobile.png`
- Desktop source and implementation were captured from a 1440 x 1000 CSS viewport. The browser image excludes its scrollbar region, producing 1425 x 990 pixel files.
- The mobile source is 1170 x 2532 pixels, equivalent to 390 x 844 CSS pixels at 3x density. The implementation was captured from the same 390 x 844 CSS viewport; the browser image excludes its scrollbar/chrome region and is 375 x 812 pixels.
- The comparison boards place reference and implementation side by side at equal visual viewport dimensions. The mobile board normalizes pixel density before comparison.

## Final measurements

- Desktop: 1020 px content measure at x=202.5; logo 90 x 90 px at y=82; introduction starts at y=500; introduction is 30 px / 39 px and 760 px wide; social links start at y=767; the first content section begins at y=855 and its heading appears near the bottom of the first viewport.
- Mobile: 90 x 90 px logo at x=24, y=24; introduction starts at y=401; introduction is 30 px / 39 px and 335 px wide; social links start at y=785; the first content section begins at y=849, five CSS pixels below the 844 px viewport.
- No horizontal overflow was observed at either viewport.

## Required fidelity surfaces

- Typography: passed. The reference's 30 px introduction scale and 1.3 line-height are matched while retaining Huang's established serif stack and Chinese copy.
- Layout rhythm: passed. Desktop logo, introduction, and first-section positions align with the live reference to within approximately one CSS pixel at the measured anchors. Mobile introduction begins at y=401, matching the supplied reference composition, while the first section enters immediately after the initial viewport.
- Colors and visual tokens: passed. Huang's existing paper background, warm ink, brown headings, and restored full-width section dividers remain unchanged.
- Brand asset: passed. The existing generated Huang mark is rendered as the real raster asset at 90 px on both breakpoints; no CSS or SVG approximation was introduced.
- Copy and social links: passed. Copy and social-link styling remain unchanged. Section-name spans stay intact on narrow screens, and social links retain 44 px interaction targets.
- Responsive behavior: passed. The desktop hero uses viewport-relative height with a minimum for short screens; the mobile hero independently aligns the introduction at y=401 and the first section at y=849 on a 390 x 844 viewport.
- Scroll transition: passed. After a 632.5 px downward scroll, the project section begins at y=222.5 and the project list is fully readable, with the following Prompt and Writing sections continuing naturally below.
- Primary interaction: passed. The first project link navigated to `/projects/her/`, produced the correct `Her — Huang` document title, and browser Back returned to the homepage.
- Browser console: passed. No errors were observed on the homepage or project detail navigation.

## Comparison history

1. The previous mid-height hero was rejected because it neither read as a complete personal showcase nor created a clear transition into the content.
2. The hero was rebuilt around viewport height. Desktop measurements now mirror the reference: logo y=82, introduction y=500, and section entry y=855.
3. Mobile verification at 390 x 844 confirmed the introduction begins at y=401 and the first section begins at y=849, eliminating the previous in-between state.
4. Side-by-side desktop and mobile comparisons found no actionable P0, P1, or P2 visual issues.

## Follow-up polish

- [P3] The implementation intentionally keeps Huang's existing background color and full-width section divider treatment instead of copying the reference site's peach background and short divider. This preserves previously approved site styling while adopting the requested viewport composition and scrolling rhythm.

final result: passed
