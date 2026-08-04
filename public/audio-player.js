(() => {
  const players = document.querySelectorAll("[data-audio-player]");
  const metingPlayers = document.querySelectorAll("[data-meting-audio]");
  if (!players.length && !metingPlayers.length) return;

  const labelControls = (root) => {
    const controls = [
      [".aplayer-pic .aplayer-button", "播放或暂停"],
      [".aplayer-icon-play", "播放或暂停"],
      [".aplayer-icon-volume-down", "调整音量"],
      [".aplayer-icon-loop", "切换循环模式"],
      [".aplayer-icon-menu", "显示播放列表"],
    ];
    controls.forEach(([selector, label]) => {
      root.querySelectorAll(selector).forEach((control) => control.setAttribute("aria-label", label));
    });
  };

  if (typeof window.APlayer === "function") players.forEach((root) => {
    if (root.dataset.audioReady === "true") return;

    const mount = root.querySelector(".audio-player-mount");
    const fallback = root.querySelector(".audio-native-fallback");
    const { audioUrl, audioTitle, audioArtist, audioCover } = root.dataset;
    if (!mount || !audioUrl) return;

    try {
      new window.APlayer({
        container: mount,
        audio: [{
          name: audioTitle || "音频",
          artist: audioArtist || "",
          url: audioUrl,
          cover: audioCover || "",
        }],
        autoplay: false,
        preload: "none",
        loop: "none",
        order: "list",
        volume: 0.7,
        mutex: true,
        listFolded: true,
        lrcType: 0,
      });

      root.dataset.audioReady = "true";
      root.classList.add("is-enhanced");
      if (fallback) fallback.hidden = true;
      labelControls(mount);
    } catch {
      mount.replaceChildren();
      root.classList.add("has-audio-error");
    }
  });

  metingPlayers.forEach((root) => {
    const status = root.querySelector(".audio-meting-status");
    const markReady = () => {
      const player = root.querySelector(".aplayer");
      if (!player) return false;
      root.dataset.audioReady = "true";
      root.classList.add("is-enhanced");
      if (status) status.hidden = true;
      labelControls(root);
      return true;
    };

    if (markReady()) return;
    const observer = new MutationObserver(() => {
      if (markReady()) observer.disconnect();
    });
    observer.observe(root, { childList: true, subtree: true });

    window.setTimeout(() => {
      if (root.dataset.audioReady === "true") return;
      observer.disconnect();
      root.classList.add("has-audio-error");
      if (status) status.textContent = "播放器暂时无法加载。";
    }, 10000);
  });
})();
