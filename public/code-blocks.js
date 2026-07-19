// 为正文代码块添加复制按钮。脚本不负责高亮，高亮 HTML 已在构建阶段生成。
const codeBlocks = document.querySelectorAll(".prose pre");

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

codeBlocks.forEach((pre) => {
  const code = pre.querySelector("code");
  if (!code) return;

  // 外层容器固定复制按钮；内部 pre 继续独立横向滚动。
  const wrapper = document.createElement("div");
  wrapper.className = "code-block";
  pre.before(wrapper);
  wrapper.append(pre);

  const button = document.createElement("button");
  button.className = "code-copy";
  button.type = "button";
  button.textContent = "复制";
  button.setAttribute("aria-label", "复制代码");
  wrapper.prepend(button);

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
