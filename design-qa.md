# 首页介绍区 Times New Roman 与位置 Design QA

## Comparison target

- Source visual truth: `C:\Users\Sonde\AppData\Local\Temp\codex-clipboard-217bebd0-2598-4f86-a51b-7c00176ae3b5.png` (2844 x 1470 px, equivalent to a 1422 x 735 CSS viewport at 2x density).
- Requested state: move the complete introduction block, including social links, upward while keeping the Projects section outside the initial viewport, then use Times New Roman for a lighter introduction texture.
- Existing logo position, English copy, type scale, paper background, social-link styling, and section layout remain unchanged.

## Evidence

- Desktop implementation: `D:\03_Project\Huang\output\design-qa\hero-times\01-desktop.png` (1265 x 712 px), captured from the default 1280 x 720 CSS viewport.
- Mobile implementation: `D:\03_Project\Huang\output\design-qa\hero-times\02-mobile.png` (375 x 812 px), captured from a 390 x 844 CSS viewport.
- Normalized desktop comparison: `D:\03_Project\Huang\output\design-qa\hero-position\03-comparison-desktop.png` (2814 x 727 px). The 2x source screenshot was downsampled to 1407 x 727 and placed beside the implementation at equal visual size.
- State: homepage, page top, light paper theme, no interaction active.
- The browser captures exclude their scrollbar region, which accounts for the difference between CSS viewport and screenshot pixels.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: passed. The introduction computes to `Times New Roman`, Times, serif at regular 400 weight. The installed Times New Roman face was confirmed available in the browser; its lighter, more compact texture avoids the previous heavy display-title feeling.
- Spacing and layout rhythm: passed. At the default desktop viewport, the introduction begins at y=444 and the social links end at y=716. Projects begins at y=792 and remains outside the 720 px first viewport.
- Responsive spacing: passed. On mobile, the introduction begins at y=346, social links end at y=813, and Projects begins at y=849, five CSS pixels below the 844 px viewport.
- Colors and visual tokens: passed. The paper background and existing foreground colors are unchanged.
- Image quality and asset fidelity: passed. The existing raster brand mark remains sharp and unchanged at both breakpoints.
- Copy and content: passed. The current greeting and site description are preserved exactly.
- Overflow: passed. No horizontal overflow was observed on desktop or mobile.
- Browser console: passed. No page errors were observed during homepage verification.

## Focused-region comparison

- A separate crop was not needed because the complete introduction and social links remain clearly readable in the normalized 1407 x 727 side-by-side comparison. The full-view comparison directly exposes the vertical change and confirms the hidden Projects boundary.

## Comparison history

1. [P2] In the supplied screenshot, the introduction sat too low and the social links touched or crossed the lower edge of the initial viewport.
2. Desktop hero bottom padding was increased from 44 px to 76 px. This moved the entire introduction and social block upward by 32 px without changing hero height or the Projects boundary.
3. Mobile hero bottom padding was increased from 20 px to 36 px. This moved the block upward by 16 px while keeping Projects below the first viewport.
4. Post-fix browser measurements and the normalized desktop comparison confirm that the complete social row is visible and Projects remains hidden at both breakpoints.
5. The introduction family was changed from `Nunito Sans` to the project-title `Libre Baskerville` stack. Browser review found this too visually heavy for the large introduction.
6. The introduction was changed to Times New Roman at regular weight. Desktop and mobile checks confirm the lighter result, stable section boundaries, and no overflow.

## Implementation checklist

- [x] Move the desktop introduction and social block upward.
- [x] Keep Projects outside the desktop initial viewport.
- [x] Apply a restrained corresponding mobile adjustment.
- [x] Verify mobile wrapping and horizontal overflow.
- [x] Use Times New Roman for the introduction while keeping project titles unchanged.
- [x] Preserve content, logo, and section layout.

## Follow-up polish

- No remaining P3 change is necessary for this adjustment.

final result: passed
