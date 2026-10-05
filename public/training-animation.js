

(() => {
  "use strict";
  const root = document.querySelector(".echo-brief");
  if (!root) return;
  const plate = root.querySelector(".eb-plate");
  const canvas = plate.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  // ---------------------------------------------------------------- constants
  const INK = [22, 19, 17];
  const FONT = "ui-monospace, monospace";
  const PARAGRAPHS = [4, 3, 5, 3];      // lines per paragraph of the human post
  const SUB_ITEMS = [2, 1, 2, 1];       // outline sub-points per paragraph in the brief
  const GOLD_FOCUS = 0.44;              // how far the post goes out of focus while Echo writes over it
  // ---------------------------------------------------------------- timeline (seconds)
  const INK_IN = [0.3, 2.3];
  const SYNTH = 2.6, SYNTH_STEP = 0.8, FLOW = 0.75;
  const DETAIL = [6.8, 7.4, 8.3, 8.9];  // to sections, hold, to one line, back to the full outline (0.6 s each move)
  const TRAIN = 9.5, TRAIN_STEP = 0.9, WRITE_LINE = 0.3;
  const FADE_OUT = 14.6, LOOP = 15.6;
  const POSTER_T = 12.3;
  const CAPTIONS = [
    { from: 0, to: 2.6, text: "a human post" },
    { from: 2.6, to: 6.8, text: "a frontier model writes the brief the post could have come from" },
    { from: 6.8, to: 9.5, text: "briefs range from a full outline to a one-line idea" },
    { from: 9.5, to: FADE_OUT + 0.4, text: "Echo learns to write the post back from the persona and the brief" },
  ];
  // ---------------------------------------------------------------- helpers
  function mulberry32(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const lerp = (a, b, s) => a + (b - a) * s;
  const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
  const smoother = (x) => { x = clamp01(x); return x * x * x * (x * (6 * x - 15) + 10); };
  function hash1(i, seed) {
    let h = Math.imul(i, 374761393) ^ Math.imul(seed + 1, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  // Smooth 1D value noise in [-1, 1].
  function noise1(x, seed) {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(hash1(i, seed), hash1(i + 1, seed), u) * 2 - 1;
  }
  // Visible while in focus, invisible when fully out of it: the hero's rule.
  const visibility = (focus) => smooth(focus);
  // ---------------------------------------------------------------- layout (plate units)
  const WORD_TH = 6.2, WORD_GAP = 7;
  // A line of greeked text: word-length strokes with small gaps, filling `len`.
  function words(len, rng, seed) {
    const out = [];
    for (let x = 0, k = 0; x < len - 8; k++) {
      const w = Math.min(len - x, 14 + 46 * Math.pow(rng(), 1.4));
      out.push({ dx: x, len: w, seed: seed + k });
      x += w + WORD_GAP;
    }
    return out;
  }
  function buildLayout(tall) {
    const rng = mulberry32(11);
    const W = tall ? 540 : 960, H = tall ? 850 : 540;
    const lineGap = tall ? 18 : 19, paraGap = tall ? 12 : 14, itemGap = tall ? 19 : 21, groupGap = tall ? 8 : 10;
    const post = { x: tall ? 50 : 70, w: tall ? 440 : 340, titleY: tall ? 60 : 78, bylineY: tall ? 86 : 104 };
    const brief = { x: tall ? 50 : 550, w: tall ? 440 : 340, headY: tall ? 462 : 78 };
    post.lines = [];
    let y = tall ? 118 : 138;
    PARAGRAPHS.forEach((count, p) => {
      for (let j = 0; j < count; j++) {
        const last = j === count - 1;
        const len = post.w * (last ? 0.35 + 0.3 * rng() : 0.84 + 0.16 * rng());
        post.lines.push({ x: post.x, y, len, words: words(len, rng, 100 + post.lines.length * 17), para: p, j });
        y += lineGap;
      }
      y += paraGap;
    });
    // The brief: one point per paragraph with its sub-points, at three levels of detail.
    const itemTop = brief.headY + (tall ? 74 : 82);
    brief.items = [];
    PARAGRAPHS.forEach((_, p) => {
      brief.items.push({ para: p, sub: false, len: (brief.w - 18) * (0.55 + 0.3 * rng()), seed: 300 + p * 10 });
      for (let k = 0; k < SUB_ITEMS[p]; k++) {
        brief.items.push({ para: p, sub: true, len: (brief.w - 40) * (0.35 + 0.35 * rng()), seed: 300 + p * 10 + k + 1 });
      }
    });
    const levelY = (showSubs) => {
      let yy = itemTop, prev = -1;
      return brief.items.map((it) => {
        if (it.sub && !showSubs) return null;
        if (prev >= 0 && it.para !== prev) yy += groupGap;
        const at = yy;
        yy += itemGap;
        prev = it.para;
        return at;
      });
    };
    const full = levelY(true), sections = levelY(false);
    brief.items.forEach((it, i) => {
      it.x = brief.x + (it.sub ? 40 : 18);
      it.yFull = full[i];
      it.ySections = sections[i] ?? full[i];
      it.words = words(it.len, rng, it.seed * 13);
    });
    // Droplets that carry ink between a paragraph and its points, in either direction.
    const drops = PARAGRAPHS.map((count, p) =>
      Array.from({ length: count * 3 + 3 }, (_, k) => ({ r: 2.6 + 2.4 * rng(), lag: k * 0.035 + 0.03 * rng(), bend: (rng() - 0.5) * 44, seed: 500 + p * 40 + k })),
    );
    return { W, H, tall, post, brief, drops, captionY: H - (tall ? 26 : 30) };
  }
  // ---------------------------------------------------------------- state at time t
  // How far each element is written (0 to 1) and how much in focus.
  function stateAt(t) {
    const out = 1 - smooth((t - FADE_OUT) / (LOOP - FADE_OUT - 0.1));
    const s = { out, post: [], echo: [], items: [], drops: [], title: 0, byline: 0, echoTitle: 0, head: [0, 0, 0], headLast: "from this outline:" };
    const { post, brief } = L;
    s.title = smooth((t - INK_IN[0]) / 0.5);
    s.byline = smooth((t - INK_IN[0] - 0.25) / 0.5);
    const gold = lerp(1, GOLD_FOCUS, smooth((t - TRAIN) / 0.5));
    post.lines.forEach((ln, i) => {
      const start = INK_IN[0] + 0.35 + i * ((INK_IN[1] - INK_IN[0] - 0.6) / post.lines.length);
      s.post.push({ focus: Math.min(smooth((t - start) / 0.55), gold) });
      const w0 = TRAIN + 0.55 + ln.para * TRAIN_STEP + 0.35 + ln.j * 0.14;
      s.echo.push({ progress: smoother((t - w0) / WRITE_LINE) });
    });
    s.echoTitle = smooth((t - TRAIN - 0.3) / 0.4);
    // Header of the brief types in; its last line names the level of detail.
    s.head = [clamp01((t - SYNTH) / 0.5), clamp01((t - SYNTH - 0.4) / 0.6), clamp01((t - SYNTH - 0.9) / 0.4)];
    const toSections = smoother((t - DETAIL[0]) / 0.6), toOne = smoother((t - DETAIL[1]) / 0.6) * (1 - smoother((t - DETAIL[3]) / 0.6));
    const backToFull = smoother((t - DETAIL[3]) / 0.6);
    const subsShown = 1 - toSections * (1 - backToFull);
    if (t >= DETAIL[1] + 0.3 && t < DETAIL[3] + 0.3) s.headLast = "from this idea:";
    else if (t >= DETAIL[0] + 0.3 && t < DETAIL[3] + 0.3) s.headLast = "from these sections:";
    const headSwap = [DETAIL[0], DETAIL[1], DETAIL[3]].reduce((m, d) => Math.min(m, Math.abs(t - (d + 0.3))), 9);
    s.headLastAlpha = t > DETAIL[0] - 0.2 && t < DETAIL[3] + 0.6 ? smooth(headSwap / 0.2) : 1;
    brief.items.forEach((it, i) => {
      const written = smoother((t - (SYNTH + it.para * SYNTH_STEP + FLOW + (it.sub ? 0.12 : 0))) / 0.35);
      let progress = written, y = lerp(it.yFull, it.ySections, toSections * (1 - backToFull)), len = it.len;
      if (it.sub) progress *= subsShown;
      if (!it.sub && it.para > 0) progress *= 1 - toOne;
      if (!it.sub && it.para === 0) len = lerp(it.len, brief.w - 18, toOne);
      // A point glows back into focus while Echo draws on it.
      const feeding = t > TRAIN ? Math.sin(Math.PI * clamp01((t - (TRAIN + 0.35 + it.para * TRAIN_STEP)) / 0.8)) : 0;
      s.items.push({ progress, y, len, focus: 1, lift: feeding });
    });
    // Droplets: paragraph → points while the brief is written; points → paragraph while Echo writes.
    L.drops.forEach((group, p) => {
      const items = brief.items.filter((it) => it.para === p);
      const first = post.lines.find((ln) => ln.para === p);
      const lines = post.lines.filter((ln) => ln.para === p);
      group.forEach((d, k) => {
        const toBrief = clamp01((t - (SYNTH + p * SYNTH_STEP + d.lag)) / FLOW);
        const toPost = clamp01((t - (TRAIN + 0.3 + p * TRAIN_STEP + d.lag)) / FLOW);
        let phase = null, u = 0, from, to;
        if (toBrief > 0 && toBrief < 1) {
          phase = "synth"; u = toBrief;
          const ln = lines[k % lines.length];
          from = { x: ln.x + ln.len, y: ln.y };
          const it = items[k % items.length];
          to = { x: it.x - 4, y: it.yFull };
        } else if (toPost > 0 && toPost < 1) {
          phase = "train"; u = toPost;
          const it = items[k % items.length];
          from = { x: it.x - 4, y: it.yFull };
          to = { x: first.x + post.w + 8, y: first.y + (k % lines.length) * (lines[1] ? lines[1].y - lines[0].y : 0) };
        }
        if (!phase) return;
        const e = smoother(u);
        const mx = (from.x + to.x) / 2 + (L.tall ? 120 : 0), my = (from.y + to.y) / 2 - (L.tall ? 0 : 46) + d.bend;
        const x = (1 - e) * (1 - e) * from.x + 2 * (1 - e) * e * mx + e * e * to.x;
        const y = (1 - e) * (1 - e) * from.y + 2 * (1 - e) * e * my + e * e * to.y;
        s.drops.push({ x, y, r: d.r * (1 - 0.35 * Math.sin(Math.PI * u)), seed: d.seed, focus: smooth(u / 0.15) * (1 - smooth((u - 0.85) / 0.15)) });
      });
    });
    return s;
  }
  // ---------------------------------------------------------------- drawing
  let L = null, scale = 1, dpr = 1;
  const inkLayer = document.createElement("canvas"), inkCtx = inkLayer.getContext("2d");
  let mottleLayer = null;
  // A hand-inked stroke: a capsule whose thickness swells and thins with the pen, with a ragged edge.
  function strokePath(c, x, y, len, th, seed, u) {
    const n = Math.max(6, Math.ceil(len / 3));
    const half = (s) => (th / 2) * (0.82 + 0.28 * noise1(s / 38, seed)) * (s < 6 ? 0.85 + 0.15 * s / 6 : 1);
    const top = [], bottom = [];
    for (let i = 0; i <= n; i++) {
      const sx = (len * i) / n, h = half(sx);
      top.push([x + sx, y - h + 0.7 * noise1(sx / 3.2, seed + 7)]);
      bottom.push([x + sx, y + h + 0.7 * noise1(sx / 3.2, seed + 11)]);
    }
    c.moveTo(top[0][0] * u, top[0][1] * u);
    for (const [px, py] of top) c.lineTo(px * u, py * u);
    const hEnd = half(len), hStart = half(0);
    for (let k = 1; k < 8; k++) {
      const a = -Math.PI / 2 + (Math.PI * k) / 8;
      c.lineTo((x + len + Math.cos(a) * hEnd * (1 + 0.1 * noise1(k, seed + 3))) * u, (y + Math.sin(a) * hEnd) * u);
    }
    for (let i = bottom.length - 1; i >= 0; i--) c.lineTo(bottom[i][0] * u, bottom[i][1] * u);
    for (let k = 1; k < 8; k++) {
      const a = Math.PI / 2 + (Math.PI * k) / 8;
      c.lineTo((x + Math.cos(a) * hStart * (1 + 0.1 * noise1(k, seed + 5))) * u, (y + Math.sin(a) * hStart) * u);
    }
    c.closePath();
  }
  const FOCUS_LEVELS = 16;
  let buckets = [];
  const softLayer = document.createElement("canvas"), softCtx = softLayer.getContext("2d");
  function queue(focus, addPath) {
    if (visibility(focus) <= 0.002) return;
    const level = Math.round(clamp01(focus) * FOCUS_LEVELS);
    (buckets[level] ||= []).push(addPath);
  }
  function flushInk(alpha) {
    buckets.forEach((list, level) => {
      if (!list) return;
      const focus = level / FOCUS_LEVELS, v = visibility(focus) * alpha;
      if (v <= 0.002) return;
      const blur = (1 - focus) * 5 * scale * dpr;
      if (blur <= 0.3) {
        inkCtx.fillStyle = `rgba(${INK[0]}, ${INK[1]}, ${INK[2]}, ${v.toFixed(3)})`;
        inkCtx.beginPath(); list.forEach((add) => add(inkCtx)); inkCtx.fill();
        return;
      }
      softCtx.clearRect(0, 0, softLayer.width, softLayer.height);
      softCtx.fillStyle = `rgb(${INK[0]}, ${INK[1]}, ${INK[2]})`;
      softCtx.beginPath(); list.forEach((add) => add(softCtx)); softCtx.fill();
      inkCtx.save();
      inkCtx.filter = `blur(${blur.toFixed(2)}px)`;
      inkCtx.globalAlpha = v;
      inkCtx.drawImage(softLayer, 0, 0);
      inkCtx.restore();
    });
    buckets = [];
  }
  function drawStroke(x, y, len, th, seed, progress, focus) {
    if (progress <= 0.004) return;
    const u = scale * dpr;
    queue(focus, (c) => strokePath(c, x, y, len * progress, th, seed, u));
  }
  // Extra words for a point stretched past its own length (the one-line idea).
  const stretchCache = new Map();
  function stretchWords(it, len) {
    if (!stretchCache.has(it)) {
      const extra = words(L.brief.w, mulberry32(it.seed), it.seed * 29).map((w) => ({ ...w, dx: w.dx + it.len + WORD_GAP }));
      stretchCache.set(it, extra);
    }
    return stretchCache.get(it).filter((w) => w.dx < len);
  }
  function drawWords(x, y, line, progress, focus, th = WORD_TH) {
    const revealed = progress * line.len;
    for (const w of line.words) {
      if (w.dx >= revealed) break;
      drawStroke(x + w.dx, y, w.len, th, w.seed, Math.min(1, (revealed - w.dx) / w.len), focus);
    }
  }
  function drawDot(x, y, r, seed, focus) {
    const u = scale * dpr;
    queue(focus, (c) => {
      for (let k = 0; k < 12; k++) {
        const a = (Math.PI * 2 * k) / 12, rr = r * (1 + 0.14 * noise1(k * 0.8, seed));
        const px = (x + Math.cos(a) * rr) * u, py = (y + Math.sin(a) * rr) * u;
        if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath();
    });
  }
  function splitNearMiddle(text) {
    const mid = text.length / 2;
    let cut = -1;
    for (let i = 0; i < text.length; i++) if (text[i] === " " && (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid))) cut = i;
    return [text.slice(0, cut), text.slice(cut + 1)];
  }
  function drawText(str, x, y, size, alpha, { bold = false, align = "left" } = {}) {
    if (!str || alpha <= 0.002) return;
    const u = scale * dpr;
    ctx.font = `${bold ? 700 : 400} ${(size * u).toFixed(2)}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = `rgba(${INK[0]}, ${INK[1]}, ${INK[2]}, ${alpha.toFixed(3)})`;
    ctx.fillText(str, x * u, y * u);
  }
  // Ink that soaked in a little unevenly: a faint blotchy texture laid over the ink only.
  function buildMottle(w, h) {
    const m = document.createElement("canvas");
    m.width = w; m.height = h;
    const c = m.getContext("2d"), rng = mulberry32(3), px = scale * dpr;
    for (let k = 0; k < 260; k++) {
      const x = rng() * w, y = rng() * h, r = (14 + 30 * rng()) * px;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(222, 213, 189, ${(0.05 + 0.07 * rng()).toFixed(3)})`);
      g.addColorStop(1, "rgba(222, 213, 189, 0)");
      c.fillStyle = g;
      c.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    return m;
  }
  function render(t) {
    const s = stateAt(t);
    const { post, brief } = L;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    inkCtx.clearRect(0, 0, w, h);
    post.lines.forEach((ln, i) => drawWords(ln.x, ln.y, ln, 1, s.post[i].focus));
    post.lines.forEach((ln, i) => drawWords(ln.x, ln.y, ln, s.echo[i].progress, 1));
    brief.items.forEach((it, i) => {
      const st = s.items[i];
      // The one-line idea stretches the first point; its words are laid out for the stretched length.
      const line = st.len === it.len ? it : { len: st.len, words: [...it.words, ...stretchWords(it, st.len)] };
      drawWords(it.x, st.y, line, st.progress, 1, (it.sub ? 5.2 : 6.2) * (1 + 0.25 * st.lift));
      if (st.progress > 0.02) drawDot(it.x - 12, st.y, (it.sub ? 1.8 : 2.5) * Math.min(1, st.progress * 3), it.seed + 1, 1);
    });
    for (const d of s.drops) drawDot(d.x, d.y, d.r, d.seed, d.focus);
    flushInk(s.out);
    inkCtx.globalCompositeOperation = "source-atop";
    inkCtx.drawImage(mottleLayer, 0, 0);
    inkCtx.globalCompositeOperation = "source-over";
    ctx.drawImage(inkLayer, 0, 0);
    // Words: the post's title and byline (paling with the post while Echo writes over it), and the brief's header.
    const goldAlpha = lerp(1, 0.3, smooth((t - TRAIN) / 0.5));
    drawText("A Blog Post", post.x, post.titleY, 23, s.title * goldAlpha * s.out, { bold: true });
    drawText("by the author", post.x, post.bylineY, 17.5, 0.72 * s.byline * goldAlpha * s.out);
    if (t > TRAIN) {
      drawText("A Blog Post".slice(0, Math.ceil(s.echoTitle * 11)), post.x, post.titleY, 23, s.out, { bold: true });
      drawText("by the author".slice(0, Math.ceil(s.echoTitle * 13)), post.x, post.bylineY, 17.5, 0.72 * s.out);
    }
    const head = ["Persona: the author", "Write a ~2,000-word essay", s.headLast];
    const headY = [brief.headY, brief.headY + 30, brief.headY + 52];
    head.forEach((line, k) => {
      const shown = k === 2 && s.head[2] >= 1 ? line : line.slice(0, Math.ceil(s.head[k] * line.length));
      drawText(shown, brief.x, headY[k], k === 0 ? 19 : 17.5, (k === 2 ? s.headLastAlpha : 1) * s.out * (s.head[k] > 0 ? 1 : 0), { bold: k === 0 });
    });
    // The caption says only what is happening now.
    for (const c of CAPTIONS) {
      const a = smooth((t - c.from) / 0.35) * (1 - smooth((t - (c.to - 0.3)) / 0.3));
      if (a <= 0.002) continue;
      const size = L.tall ? 18 : 18.5;
      ctx.font = `400 ${(size * scale * dpr).toFixed(2)}px ${FONT}`;
      const fits = ctx.measureText(c.text).width <= (L.W - 40) * scale * dpr;
      const lines = fits ? [c.text] : splitNearMiddle(c.text);
      lines.forEach((line, k) => drawText(line, L.W / 2, L.captionY - (lines.length - 1 - k) * size * 1.3, size, a, { align: "center" }));
    }
  }
  // ---------------------------------------------------------------- sizing and the clock
  function resize() {
    const rect = plate.getBoundingClientRect();
    if (rect.width === 0) return false;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const tall = rect.height > rect.width;
    if (!L || L.tall !== tall) L = buildLayout(tall);
    scale = rect.width / L.W;
    canvas.width = inkLayer.width = softLayer.width = Math.round(rect.width * dpr);
    canvas.height = inkLayer.height = softLayer.height = Math.round(rect.height * dpr);
    mottleLayer = buildMottle(canvas.width, canvas.height);
    return true;
  }
  const query = new URLSearchParams(location.search);
  const frozen = query.has("t") ? ((Number(query.get("t")) % LOOP) + LOOP) % LOOP : null;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let playhead = 0, lastNow = null, visible = true, rafId = 0;
  function frame(now) {
    rafId = 0;
    if (lastNow !== null) playhead = (playhead + Math.min(0.1, (now - lastNow) / 1000)) % LOOP;
    lastNow = now;
    render(playhead);
    schedule();
  }
  function schedule() {
    if (!visible || document.hidden) { lastNow = null; return; }
    if (!rafId) rafId = requestAnimationFrame(frame);
  }
  Promise.all([document.fonts.load(`400 13px ${FONT}`), document.fonts.load(`700 13px ${FONT}`)]).then(() => {
    new ResizeObserver(() => { if (resize()) render(frozen ?? (reducedMotion ? POSTER_T : playhead)); }).observe(plate);
    if (!resize()) return;
    if (frozen !== null || reducedMotion) {
      render(frozen ?? POSTER_T);
      // A frozen page can be stepped from outside, for exporting frames.
      if (frozen !== null) window.echoBrief = { render, loop: LOOP };
      return;
    }
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (!visible && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      schedule();
    }).observe(root);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      schedule();
    });
    schedule();
  });
})();

