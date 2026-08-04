// 根据正文当前阅读位置，高亮右侧目录中对应的章节。
const toc = document.querySelector(".article-toc");

if (toc) {
  const items = [...toc.querySelectorAll('a[href^="#"]')]
    .map((link) => {
      const id = decodeURIComponent(link.hash.slice(1));
      const heading = document.getElementById(id);
      return heading ? { heading, link } : null;
    })
    .filter(Boolean);

  let activeLink = null;
  let framePending = false;

  // APlayer 自带的平滑滚动会接管全页锚点，但无法正确解析中文 hash。
  // 在捕获阶段由本站目录先完成跳转，避免音乐页面的目录链接失效。
  toc.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!link || !toc.contains(link)) return;

    let id;
    try {
      id = decodeURIComponent(link.hash.slice(1));
    } catch {
      return;
    }
    const heading = document.getElementById(id);
    if (!heading) return;

    event.preventDefault();
    event.stopPropagation();
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    heading.scrollIntoView({ behavior, block: "start" });
    if (window.location.hash !== link.hash) window.history.pushState(null, "", link.hash);
    scheduleUpdate();
  }, { capture: true });

  function keepActiveLinkVisible(link) {
    const linkTop = link.offsetTop;
    const linkBottom = linkTop + link.offsetHeight;
    const visibleTop = toc.scrollTop + 36;
    const visibleBottom = toc.scrollTop + toc.clientHeight - 12;

    if (linkTop < visibleTop) {
      toc.scrollTop = Math.max(0, linkTop - 36);
    } else if (linkBottom > visibleBottom) {
      toc.scrollTop += linkBottom - visibleBottom;
    }
  }

  function updateActiveHeading() {
    framePending = false;
    if (!items.length) return;

    const readingLine = 132;
    let current = items[0];
    for (const item of items) {
      if (item.heading.getBoundingClientRect().top <= readingLine) {
        current = item;
      } else {
        break;
      }
    }

    if (activeLink === current.link) return;
    activeLink?.removeAttribute("aria-current");
    current.link.setAttribute("aria-current", "location");
    activeLink = current.link;
    keepActiveLinkVisible(current.link);
  }

  function scheduleUpdate() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateActiveHeading);
  }

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  updateActiveHeading();
}
