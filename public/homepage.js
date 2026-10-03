(() => {
  const archive = document.querySelector(".archive");
  const template = document.querySelector("#archive-cards");
  if (!archive || !template) return;

  const cards = [...template.content.children].map((card) => ({
    card,
    kind: card.dataset.kind,
    tags: JSON.parse(card.dataset.tags),
  }));
  const count = archive.querySelector(".result-count");
  const activeTag = archive.querySelector(".active-tag");
  const showMore = archive.querySelector(".see-all");
  const filterButtons = [...archive.querySelectorAll(".archive-filters button")];
  const navLinks = [...document.querySelectorAll("[data-nav-kind]")];
  const tagLinks = [...document.querySelectorAll(".tag-list a")];
  let grid = archive.querySelector(".archive-grid");
  let selection = null;
  let expanded = false;
  let filterKey = JSON.stringify(["全部", null]);

  function kindForHash(hash) {
    return { "#projects": "项目", "#writings": "写作", "#readings": "阅读" }[hash] || "全部";
  }

  function render(hash = location.hash, animate = true) {
    const localSelection = selection?.hash === hash ? selection : null;
    const kind = localSelection?.kind || kindForHash(hash);
    const tag = localSelection?.tag || null;
    const matching = cards.filter((entry) => (kind === "全部" || entry.kind === kind) && (!tag || entry.tags.includes(tag)));
    const key = JSON.stringify([kind, tag]);

    // A filter mounts one new grid; expansion keeps the first nine cards intact.
    if (key !== filterKey) {
      const nextGrid = grid.cloneNode(false);
      if (animate) nextGrid.dataset.filtered = "true";
      else delete nextGrid.dataset.filtered;
      nextGrid.append(...matching.slice(0, 9).map(({ card }) => card.cloneNode(true)));
      grid.replaceWith(nextGrid);
      grid = nextGrid;
      filterKey = key;
      expanded = false;
    }

    const targetLength = expanded ? matching.length : Math.min(9, matching.length);
    while (grid.children.length > targetLength) grid.lastElementChild.remove();
    if (grid.children.length < targetLength) {
      grid.append(...matching.slice(grid.children.length, targetLength).map(({ card }) => card.cloneNode(true)));
    }

    count.textContent = `${matching.length} 篇`;
    activeTag.hidden = !tag;
    activeTag.querySelector("span").textContent = tag ? `标签：${tag}` : "";
    filterButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.kind === kind)));
    navLinks.forEach((link) => link.classList.toggle("is-active", link.hash === "#home" ? kind === "全部" : link.hash !== "#archive" && link.dataset.navKind === kind));
    tagLinks.forEach((link) => {
      if (link.dataset.tag === tag) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    showMore.hidden = matching.length <= 9;
    showMore.setAttribute("aria-expanded", String(expanded));
    showMore.firstChild.textContent = expanded ? "收起" : "查看全部";
  }

  filterButtons.forEach((button) => button.addEventListener("click", () => {
    selection = { hash: location.hash, kind: button.dataset.kind, tag: null };
    expanded = false;
    render();
  }));

  tagLinks.forEach((link) => link.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    selection = { hash: "#archive", kind: "全部", tag: link.dataset.tag };
    expanded = false;
    render("#archive");
  }));

  navLinks.forEach((link) => link.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    selection = null;
    expanded = false;
    render(link.hash);
  }));

  activeTag.querySelector("button").addEventListener("click", () => {
    selection = { hash: location.hash, kind: "全部", tag: null };
    expanded = false;
    render();
  });

  showMore.addEventListener("click", () => {
    expanded = !expanded;
    render();
  });

  window.addEventListener("hashchange", () => {
    if (selection?.hash !== location.hash) selection = null;
    expanded = false;
    render();
  });

  render(location.hash, false);
})();
