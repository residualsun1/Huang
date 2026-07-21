// 为正文代码块与 Prompt 展示块启用复制按钮。工具栏 HTML 已在构建阶段生成。
const copyBlocks = document.querySelectorAll(".prose .code-block, .prose .prompt-block");

async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  // 本地 HTTP 预览可能没有 Clipboard API，使用隐藏文本框作为兼容方案。
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

copyBlocks.forEach((block) => {
  const button = block.querySelector(".code-copy");
  const source = block.querySelector("[data-copy-source]");
  const label = button?.querySelector(".copy-button-label");
  if (!button || !source || !label) return;

  button.addEventListener("click", async () => {
    try {
      await copyText(source.textContent || "");
      label.textContent = "已复制";
      button.setAttribute("aria-label", "已复制");
      button.classList.add("is-copied");
    } catch {
      label.textContent = "复制失败";
      button.setAttribute("aria-label", "复制失败");
    }
    window.setTimeout(() => {
      label.textContent = "复制";
      button.setAttribute("aria-label", block.classList.contains("prompt-block") ? "复制提示词" : "复制代码");
      button.classList.remove("is-copied");
    }, 1600);
  });
});
