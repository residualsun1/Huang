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
