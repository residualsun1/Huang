document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.renderMathInElement !== "function") return;
  window.renderMathInElement(document.querySelector(".prose"), {
    throwOnError: false,
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "\\(", right: "\\)", display: false },
      { left: "$", right: "$", display: false },
    ],
  });
});
