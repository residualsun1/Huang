// 为正文代码块启用复制按钮。工具栏与高亮 HTML 已在构建阶段生成。
const codeBlocks = document.querySelectorAll(".prose .code-block");

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

codeBlocks.forEach((block) => {
  const pre = block.querySelector("pre");
  const button = block.querySelector(".code-copy");
  if (!pre || !button) return;
  const code = pre.querySelector("code");
  if (!code) return;

  button.addEventListener("click", async () => {
    try {
      await copyText(code.textContent || "");
      button.textContent = "已复制";
      button.classList.add("is-copied");
    } catch {
      button.textContent = "复制失败";
    }
    window.setTimeout(() => {
      button.textContent = "复制";
      button.classList.remove("is-copied");
    }, 1600);
  });
});
