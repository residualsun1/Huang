(() => {
  const player = document.querySelector("[data-vinyl-player]");
  if (!player) return;

  const button = player.querySelector(".vinyl-player__button");
  const audio = player.querySelector("[data-vinyl-audio]");
  const status = player.querySelector(".vinyl-player__status");
  const source = audio?.dataset.src;

  if (!button || !audio || !status || !source) return;

  audio.volume = 0.45;

  const setPlaying = (playing) => {
    button.dataset.playing = String(playing);
    button.setAttribute("aria-pressed", String(playing));
    button.setAttribute("aria-label", playing ? "暂停背景音乐" : "播放背景音乐");
  };

  const announceUnavailable = () => {
    setPlaying(false);
    player.dataset.audioUnavailable = "true";
    status.textContent = "音乐文件尚未加入，请稍后再试。";
  };

  audio.addEventListener("play", () => {
    delete player.dataset.audioUnavailable;
    setPlaying(true);
    status.textContent = "正在播放背景音乐。";
  });

  audio.addEventListener("pause", () => {
    setPlaying(false);
    if (audio.currentTime > 0 && !audio.ended) {
      status.textContent = "背景音乐已暂停。";
    }
  });

  audio.addEventListener("ended", () => {
    setPlaying(false);
    status.textContent = "背景音乐播放完毕。";
  });

  audio.addEventListener("error", announceUnavailable);

  button.addEventListener("click", async () => {
    if (!audio.paused) {
      audio.pause();
      return;
    }

    if (!audio.getAttribute("src")) {
      audio.src = source;
      audio.load();
    }

    try {
      await audio.play();
    } catch {
      announceUnavailable();
    }
  });

  window.addEventListener("pagehide", () => {
    if (!audio.paused) audio.pause();
  });
})();
