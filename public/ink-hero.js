

(() => {
  "use strict";
  const root = document.querySelector(".echo-hero");
  if (!root) return;
  const plate = root.querySelector(".eh-plate");
  const inkCanvas = root.querySelector(".eh-ink");
  const stageEls = [...root.querySelectorAll(".eh-step")];
  const askMarkEl = root.querySelector(".eh-ask-mark");
  const promptEl = root.querySelector(".eh-prompt");
  const promptUnsaidEl = root.querySelector(".eh-prompt-unsaid");
  // ---------------------------------------------------------------- constants
  const INK_RGB = [22 / 255, 19 / 255, 17 / 255];
  const PLATE_H = 540;              // internal units; the width follows the aspect ratio
  const STAGES_H = 48;              // the ground under the ink, where the stage names sit
  const INK_H = PLATE_H - STAGES_H; // the ink lives above them
  const PARTICLES = 160;            // ink kernels for the marks
  const TRAIL = [                   // the thought's trail of dots: position from mark to bubble, and visible radius
    [0.16, 3.6], [0.5, 5.6], [0.86, 8],
  ];
  const MAX_THOUGHTS = 3;           // bubbles up at once: the base model thinks several documents side by side
  const KERNELS = PARTICLES + TRAIL.length * MAX_THOUGHTS;  // the shader's array size
  const BUBBLE_W = 290;             // default bubble width, plate units
  const NARROW_W = 700;             // plates narrower than this many units (phones) put each thought above its mark
  const ISO = 0.25;                 // field value at the ink's edge
  const VISIBLE_FRACTION = Math.sqrt(1 - Math.cbrt(ISO));  // edge radius / kernel radius, for a lone kernel
  const DISC_RADIUS = 108;
  const SPECK_INK_AREA = Math.PI * DISC_RADIUS * DISC_RADIUS;  // the specks hold exactly the coalesced drop's ink
  const ASSISTANT_HALF = DISC_RADIUS * Math.sqrt(Math.PI) / 2;  // the assistant's square holds the same ink
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  const SDF_RANGE = 32;             // plate units of signed distance stored in a shape texture
  const SDF_SLOPE = 0.05;           // field units per plate unit when a shape texture stands in for the kernels
  const TEX_SCALE = 0.5;            // shape texture texels per plate unit
  // A persona mark is never quite still: its outline drifts through slowly moving noise. The noise travels a closed
  // circle once per loop, so the drift is seamless at the loop point.
  const MARK_WOBBLE = 5;            // plate units an outline drifts at most
  const WOBBLE_SCALE = 70;          // plate units across one bend of the drift
  const WOBBLE_ORBIT = 1.6;         // radius of the noise circle; larger drifts faster
  const TYPE_CPS = 88;
  const PROMPT_CPS = 120;
  const HOLD = 0.9;
  const PERSONA_SETTLE = 0.55;      // a persona's thought starts once its mark has mostly formed
  // A base model continues any document at all, so each speck thinks the opening of a different one.
  const DOCUMENTS = [
    "Preheat the oven to 400°F and grease two loaf pans.",
    "lol same. anyone else get this after the update?",
    "The Court finds that the plaintiff has failed to state a claim.",
    "for (let i = 0; i < rows.length; i++) {",
    "Paris is the capital and most populous city of France.",
    "She had not spoken to him since the funeral.",
  ];
  // Where on the plate each document's speck is chosen, as a fraction of the width: consecutive documents overlap in
  // time, so they sit in different thirds.
  const DOCUMENT_ZONES = [[0, 0.4], [0.6, 1], [0.3, 0.7], [0, 0.4], [0.6, 1], [0.3, 0.7]];
  // ---------------------------------------------------------------- timeline (seconds)
  const PRE_END = 9.0;
  const DOCUMENT_STARTS = [0.6, 1.65, 2.75, 3.85, 4.9, 5.95];
  const DOCUMENT_HOLD = 1.7;        // a document stays up this long once typed, while the next ones start
  // The specks' coalescence is simulated on its own clock (SIM_START to SIM_END, pulled by PULLS) and played back
  // SIM_SLOWDOWN times slower from ASSIST_START.
  const SIM_START = 7.3;
  const SIM_END = 11.6;
  const PULLS = [[7.3, 0.8], [8.85, 1.6], [10.1, 4.5]];  // each assistant prompt pulls harder toward the centre
  const ASSIST_START = PRE_END + 0.1;
  const SIM_SLOWDOWN = 1.25;
  const onPlayback = (simT) => ASSIST_START + (simT - SIM_START) * SIM_SLOWDOWN;
  // While the last droplets are still merging, the ink is pressed straight into the square: the press accelerates,
  // and the square dips a little smaller on impact before springing back to size.
  const SQUEEZE_START = onPlayback(9.7);
  const SQUEEZE_DUR = 1.0;
  const RECOIL_DUR = 0.35;
  const RECOIL = 0.05;              // how much smaller the impact presses the square, as a fraction of its size
  const PRESS_END = SQUEEZE_START + SQUEEZE_DUR + RECOIL_DUR;
  const POST_END = PRESS_END + 2.4;
  const HANDOFF = 0.75;             // the blot sits alone while "assistant" becomes "writing model"
  const MORPH = 1.2;
  const RESET_DUR = 1.2;
  // The writing model's lines: the openings of Echo's replies in the post's capabilities viewer (_data/echo/grid.json),
  // trimmed at a phrase boundary.
  const PERSONAS = [
    { name: "the Bible", sample: "I have seen also another work which men do beneath the sun; and behold, the labour thereof is very great." },
    { name: "Emily Dickinson", sample: "You ask what Coffee tastes of — And I can only say — A draft of Darkness sent from God…" },
    { name: "Joe Carlsmith", sample: "Here’s something I was thinking about recently. Some chess players have styles that focus on explicit “calculation”…" },
  ].map((p) => ({ ...p, prompt: `write as ${p.name}` }));
  {
    let t = POST_END + HANDOFF;
    for (const p of PERSONAS) { p.start = t; t += PERSONA_SETTLE + 0.2 + p.sample.length / TYPE_CPS + HOLD; }
  }
  const LAST_PERSONA = PERSONAS[PERSONAS.length - 1];
  const RESET_START = LAST_PERSONA.start + PERSONA_SETTLE + 0.2 + LAST_PERSONA.sample.length / TYPE_CPS + HOLD + 0.4;
  const LOOP = RESET_START + RESET_DUR;
  // The still frame (reduced motion) is Dickinson's blot, fully formed and thinking its line.
  const POSTER_PERSONA = PERSONAS[1];
  const POSTER_T = POSTER_PERSONA.start + PERSONA_SETTLE + 0.2 + POSTER_PERSONA.sample.length / TYPE_CPS + 0.6;
  // What the readout shows, keyed by the time each line starts, and who thinks it: a probed speck or a mark. A line
  // lasts until the next one starts, except the base model's documents, which overlap.
  const SCRIPT = [
    ...DOCUMENT_STARTS.map((t, i) => ({
      t, prompt: "", sample: DOCUMENTS[i], probe: i, end: Math.min(PRE_END - 0.1, t + 0.08 + DOCUMENTS[i].length / TYPE_CPS + DOCUMENT_HOLD),
    })),
    // The instructions pull the specks together; only the finished square answers.
    { t: ASSIST_START, prompt: "You are a helpful assistant.", sample: "", mark: 0 },
    { t: onPlayback(8.85), prompt: "You are a helpful, harmless and honest AI assistant.", sample: "", mark: 0 },
    { t: PRESS_END + 0.1, prompt: "Who are you?", sample: "I'm an AI assistant. I don't have personal opinions, but I'm happy to help!", mark: 0 },
    { t: POST_END - 0.05, prompt: "", sample: "" },
    ...PERSONAS.map((p, i) => ({ t: p.start + 0.05, prompt: p.prompt, sample: p.sample, mark: i + 1, delay: PERSONA_SETTLE })),
    { t: RESET_START, prompt: "", sample: "" },
  ];
  SCRIPT.forEach((line, i) => {
    line.retype = line.prompt !== (i > 0 ? SCRIPT[i - 1].prompt : "");
    const promptTime = line.retype && line.prompt ? line.prompt.length / PROMPT_CPS + 0.18 : 0.08;
    line.sampleStart = line.t + promptTime + (line.delay || 0);
    line.end ??= i + 1 < SCRIPT.length ? SCRIPT[i + 1].t : LOOP;
  });
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
  // Minimum-cost perfect matching (Hungarian algorithm, O(n^3)); cost is row-major n*n.
  function hungarian(cost, n) {
    const u = new Float64Array(n + 1), v = new Float64Array(n + 1);
    const p = new Int32Array(n + 1), way = new Int32Array(n + 1);
    const minv = new Float64Array(n + 1), used = new Uint8Array(n + 1);
    for (let i = 1; i <= n; i++) {
      p[0] = i; let j0 = 0;
      minv.fill(Infinity); used.fill(0);
      do {
        used[j0] = 1;
        const i0 = p[j0], row = (i0 - 1) * n;
        let delta = Infinity, j1 = 0;
        for (let j = 1; j <= n; j++) {
          if (used[j]) continue;
          const cur = cost[row + j - 1] - u[i0] - v[j];
          if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
          if (minv[j] < delta) { delta = minv[j]; j1 = j; }
        }
        for (let j = 0; j <= n; j++) {
          if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
        }
        j0 = j1;
      } while (p[j0] !== 0);
      do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
    }
    const assign = new Int32Array(n);
    for (let j = 1; j <= n; j++) assign[p[j] - 1] = j - 1;
    return assign;
  }
  // assign[i] = index of the `to` point that `from[i]` travels to, minimising total squared distance.
  function matchPoints(from, to) {
    const n = from.length;
    console.assert(n === to.length, "matchPoints needs equal sizes");
    const cost = new Float64Array(n * n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const dx = from[i].x - to[j].x, dy = from[i].y - to[j].y;
        cost[i * n + j] = dx * dx + dy * dy;
      }
    }
    return hungarian(cost, n);
  }
  // ---------------------------------------------------------------- persona marks (signed distance, plate units)
  const sdCircle = (x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) - r;
  // Union of two SDFs, blended over about k plate units so they join like ink running together.
  function smoothMin(a, b, k) {
    const h = clamp01(0.5 + 0.5 * (b - a) / k);
    return lerp(b, a, h) - k * h * (1 - h);
  }
  function sdBox(x, y, cx, cy, hw, hh, round) {
    const qx = Math.abs(x - cx) - hw + round, qy = Math.abs(y - cy) - hh + round;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - round;
  }
  // Smooth value noise in [-1, 1], two octaves.
  function hash2(ix, iy, seed) {
    let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(seed + 1, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function valueNoise(x, y, seed) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const top = lerp(hash2(ix, iy, seed), hash2(ix + 1, iy, seed), ux);
    const bottom = lerp(hash2(ix, iy + 1, seed), hash2(ix + 1, iy + 1, seed), ux);
    return lerp(top, bottom, uy) * 2 - 1;
  }
  const fbm = (x, y, seed) => 0.65 * valueNoise(x, y, seed) + 0.35 * valueNoise(x * 2.03 + 17.1, y * 2.03 - 9.3, seed + 1);
  // A hand-made version of a shape: its outline bends a little, as a hand-cut or brushed edge does,
  // and the edge itself is slightly ragged, as ink is where it meets paper.
  function handmade(body, seed, warp, rough) {
    return (x, y) => {
      const wx = x + warp * fbm(x / 90, y / 90, seed);
      const wy = y + warp * fbm(x / 90 + 31.7, y / 90 - 12.4, seed + 7);
      return body(wx, wy) + rough * fbm(x / 14, y / 14, seed + 13);
    };
  }
  // A blot: discs of ink run together (a smooth union over k plate units), minus any holes, optionally cut flat at a
  // floor below its centre.
  function sdBlot(x, y, cx, cy, { discs, holes = [], k = 28, floor = Infinity }) {
    let d = sdCircle(x, y, cx + discs[0][0], cy + discs[0][1], discs[0][2]);
    for (const [dx, dy, r] of discs.slice(1)) d = smoothMin(d, sdCircle(x, y, cx + dx, cy + dy, r), k);
    for (const [dx, dy, r] of holes) d = Math.max(d, -sdCircle(x, y, cx + dx, cy + dy, r));
    return Math.max(d, y - (cy + floor));
  }
  // Each persona's blot, in PERSONAS order: [dx, dy, r] discs around the plate's centre, holes, a floor, and droplets
  // that stand apart. Every one a different silhouette; none of them means anything.
  const BLOTS = [
    { discs: [[-176, 16, 32], [-104, -4, 48], [-22, 8, 58], [62, -8, 54], [140, 8, 42], [198, -6, 24]], k: 34 },  // a long low swell
    { discs: [[-10, -70, 56], [18, -6, 74], [-8, 62, 66], [52, 70, 34]], k: 32 },                                // a leaning lump
    { discs: [[-30, -36, 82], [42, 32, 86], [-62, 76, 40]], holes: [[74, -74, 58]], drops: [[-132, 118, 11]] },   // lopsided, bitten
  ];
  // Where a mark's thought comes from: a point on the body's outline, with the bubble opening diagonally away from it.
  // Every outline point and direction is scored: the bubble must stay on the plate, should cover no ink (sdf includes
  // the droplets) and should sit up and to the right, where the eye expects it.
  function thoughtFor(body, sdf, chars, W) {
    const inkUnder = (box) => {
      let n = 0;
      for (let y = box.y0; y < box.y1; y += 12) for (let x = box.x0; x < box.x1; x += 12) n += sdf(x, y) < 8;
      return n;
    };
    let best = null;
    for (let y = 8; y < INK_H; y += 14) {
      for (let x = 8; x < W; x += 14) {
        const d = body(x, y);
        if (d < -7 || d > 2) continue;
        for (const dir of [[1, -1], [1, 1], [-1, -1], [-1, 1]]) {
          const e = [x + dir[0] * 14, y + dir[1] * 10], a = [e[0] + dir[0] * 30, e[1] + dir[1] * 26];
          const width = Math.min(360, dir[0] > 0 ? W - 14 - a[0] : a[0] - 14);
          if (width < 240) continue;
          const box = bubbleBox({ a, dir, width }, chars, W);
          if (outside(box, W) > 0) continue;
          const cost = inkUnder(box) * 1000 - (x - 1.2 * y) + (dir[0] > 0 && dir[1] < 0 ? 0 : 60);
          if (!best || cost < best.cost) best = { e, a, dir, width, cost };
        }
      }
    }
    console.assert(best, "no room for a thought beside this mark");
    return best;
  }
  // On a narrow plate a mark's thought is a bubble across the plate just above it; its trail rises from the mark's top
  // (tail is where the trail meets the bubble, when that is not the bubble's corner a).
  function thoughtAbove(body, W) {
    let top = null;
    for (let y = 4; y < INK_H && !top; y += 4) {
      for (let x = 4; x < W; x += 4) if (body(x, y) < 0 && (!top || Math.abs(x - W / 2) < Math.abs(top.x - W / 2))) top = { x, y };
    }
    const thought = { e: [top.x + 6, top.y - 10], tail: [top.x + 24, top.y - 48], a: [14, top.y - 52], dir: [1, -1], width: W - 28 };
    console.assert(bubbleBox(thought, 110, W).y0 >= 4, "no room above this mark for its thought");
    return thought;
  }
  // A mark is a body (an SDF) plus a few separate dots, which get their own kernels.
  function personaMarks(W, cy) {
    const cx = W / 2;
    console.assert(BLOTS.length === PERSONAS.length, "one blot per persona");
    const blots = PERSONAS.map((persona, i) => {
      const blot = BLOTS[i];
      const body = handmade((x, y) => sdBlot(x, y, cx, cy, blot), 23 + 14 * i, 10, 0.6);
      const dots = (blot.drops || []).map(([dx, dy, r]) => ({ x: cx + dx, y: cy + dy, r }));
      const sdf = (x, y) => dots.reduce((d, dot) => Math.min(d, sdCircle(x, y, dot.x, dot.y, dot.r)), body(x, y));
      return { body, dots, thought: W < NARROW_W ? thoughtAbove(body, W) : thoughtFor(body, sdf, persona.sample.length, W) };
    });
    const square = (x, y) => sdBox(x, y, cx, cy, ASSISTANT_HALF, ASSISTANT_HALF, 0);
    return [
      { // the assistant: the drop drawn into a plain square, exact and still, the one mark not made by hand
        thought: W < NARROW_W ? thoughtAbove(square, W)
          : { e: [cx + ASSISTANT_HALF + 12, cy - ASSISTANT_HALF + 26], a: [cx + ASSISTANT_HALF + 44, cy - ASSISTANT_HALF - 6], dir: [1, -1] },
        body: square,
        wobble: 0,
        dots: [] },
      ...blots,
    ].map((m) => ({
      focus: () => 1,
      wobble: MARK_WOBBLE,
      ...m,
      sdf: (x, y) => m.dots.reduce((d, dot) => Math.min(d, sdCircle(x, y, dot.x, dot.y, dot.r)), m.body(x, y)),
    }));
  }
  // Kernels for a mark: a jittered hex lattice over the body, plus one kernel per dot. Each kernel is
  // sized by its depth inside the body, so thin strokes keep ink along their whole length mid-morph.
  function markKernels(mark, rng, W) {
    const dotKernels = mark.dots.map((d) => ({ x: d.x, y: d.y, r: d.r / VISIBLE_FRACTION, f: mark.focus(d.x, d.y) }));
    const bodyCount = PARTICLES - dotKernels.length;
    const lattice = (step) => {
      const pts = [], rowH = step * Math.sqrt(3) / 2;
      for (let row = 0, y = 0; y < PLATE_H; row++, y = row * rowH) {
        for (let x = (row % 2) * step / 2; x < W; x += step) {
          const depth = -mark.body(x, y);
          if (depth > 1) pts.push({ x, y, depth });
        }
      }
      return pts;
    };
    let lo = 3, hi = 60;
    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      if (lattice(mid).length >= bodyCount) lo = mid; else hi = mid;
    }
    const pts = lattice(lo);
    while (pts.length > bodyCount) pts.splice(Math.floor(rng() * pts.length), 1);
    const jitter = lo * 0.1, rMax = lo * 1.9;
    return pts.map((p) => ({
      x: p.x + (rng() - 0.5) * jitter, y: p.y + (rng() - 0.5) * jitter,
      r: Math.min(rMax, Math.max(lo * 0.9, (p.depth + lo * 0.3) / VISIBLE_FRACTION)),
      f: mark.focus(p.x, p.y),
    })).concat(dotKernels);
  }
  // Two bytes per texel: signed distance (128 is the edge, larger is inside) and focus.
  function markTexture(mark, W) {
    const tw = Math.round(W * TEX_SCALE), th = Math.round(PLATE_H * TEX_SCALE);
    const data = new Uint8Array(tw * th * 2);
    for (let j = 0; j < th; j++) {
      for (let i = 0; i < tw; i++) {
        const x = (i + 0.5) / TEX_SCALE, y = (j + 0.5) / TEX_SCALE;
        data[(j * tw + i) * 2] = Math.max(0, Math.min(255, Math.round(128 - mark.sdf(x, y) * (127 / SDF_RANGE))));
        data[(j * tw + i) * 2 + 1] = Math.round(mark.focus(x, y) * 255);
      }
    }
    return { tw, th, data };
  }
  // ---------------------------------------------------------------- pre-training specks
  function makeSpecks(W, rng) {
    const count = W > 800 ? 56 : 46;
    const specks = [];
    for (let tries = 0; specks.length < count && tries < 40000; tries++) {
      const rho = 4 + 22 * Math.pow(rng(), 2.1);
      const x = 36 + rho + rng() * (W - 72 - 2 * rho), y = 32 + rho + rng() * (INK_H - 60 - 2 * rho);
      if (specks.every((s) => Math.hypot(s.x - x, s.y - y) > (s.rho + rho) * 1.7 + 24)) specks.push({ x, y, rho });
    }
    const area = specks.reduce((a, s) => a + Math.PI * s.rho * s.rho, 0);
    const grow = Math.sqrt(SPECK_INK_AREA / area);
    for (const s of specks) s.rho *= grow;
    // Share the kernels out by area, at least one each.
    const shares = specks.map((s) => Math.max(1, Math.round(PARTICLES * (Math.PI * s.rho * s.rho) / SPECK_INK_AREA)));
    let total = shares.reduce((a, b) => a + b, 0);
    const bySize = specks.map((_, i) => i).sort((a, b) => specks[b].rho - specks[a].rho);
    for (let k = 0; total !== PARTICLES; k = (k + 1) % bySize.length) {
      const i = bySize[k];
      if (total > PARTICLES && shares[i] > 1) { shares[i]--; total--; } else if (total < PARTICLES) { shares[i]++; total++; }
    }
    const kernels = [];
    specks.forEach((s, si) => {
      const m = shares[si];
      s.focusAt = 0.05 + rng() * 6.0;
      const heading = rng() * Math.PI * 2, bend = (rng() - 0.5) * 1.6;
      if (m === 1) { kernels.push({ x: s.x, y: s.y, r: s.rho / VISIBLE_FRACTION, speck: si }); return; }
      // A speck of several kernels is a lump with a tail: a drop, a comma, a bean.
      const main = (s.rho / VISIBLE_FRACTION) * (0.72 + 0.28 / Math.sqrt(m));
      kernels.push({ x: s.x, y: s.y, r: main, speck: si });
      for (let k = 1; k < m; k++) {
        const along = k / m, a = heading + bend * along;
        const dist = s.rho * (0.35 + 0.9 * along) * (0.8 + 0.4 * rng());
        kernels.push({ x: s.x + Math.cos(a) * dist, y: s.y + Math.sin(a) * dist, r: main * (0.95 - 0.55 * along) * (0.85 + 0.3 * rng()), speck: si });
      }
    });
    for (const k of kernels) k.wob = [1 + Math.floor(rng() * 4), 1 + Math.floor(rng() * 4), rng() * 6.283, rng() * 6.283, 1.5 + rng() * 3.5];
    return { specks, kernels };
  }
  // A slow drift with whole cycles per loop, so it is seamless at the loop point.
  function wobble(k, t, out) {
    const w = k.wob, ph = (t / LOOP) * 4 * Math.PI;
    out.x = k.x + w[4] * Math.sin(w[0] * ph + w[2]);
    out.y = k.y + w[4] * Math.cos(w[1] * ph + w[3]);
    return out;
  }
  // ---------------------------------------------------------------- post-training: droplets coalescing
  // A small simulation, run once: every speck is a droplet pulled toward the centre and toward its
  // neighbours; droplets that touch merge, and a merged drop rounds itself off like surface tension.
  function simulateAccretion(specks, kernels, cx, cy) {
    const DT = 1 / 120;
    const steps = Math.round((SIM_END - SIM_START) / DT) + 1;
    const track = new Float32Array(steps * PARTICLES * 3);
    const px = new Float64Array(PARTICLES), py = new Float64Array(PARTICLES), pr = new Float64Array(PARTICLES);
    const ox = new Float64Array(PARTICLES), oy = new Float64Array(PARTICLES);
    const tmpPos = { x: 0, y: 0 };
    kernels.forEach((k, i) => { wobble(k, ASSIST_START, tmpPos); px[i] = tmpPos.x; py[i] = tmpPos.y; pr[i] = k.r; });
    const bodies = specks.map((s) => ({ members: [], area: Math.PI * s.rho * s.rho, x: 0, y: 0, vx: 0, vy: 0, alive: true, slots: null }));
    kernels.forEach((k, i) => bodies[k.speck].members.push(i));
    const bodyOf = Int32Array.from(kernels, (k) => k.speck);
    const recentre = (b) => {
      let sw = 0, sx = 0, sy = 0;
      for (const i of b.members) { const w = pr[i] * pr[i]; sw += w; sx += px[i] * w; sy += py[i] * w; }
      b.x = sx / sw; b.y = sy / sw;
      for (const i of b.members) { ox[i] = px[i] - b.x; oy[i] = py[i] - b.y; }
    };
    bodies.forEach(recentre);
    // Where the kernels of a merged drop settle: a sunflower packing, outer slots to the nearest kernels.
    const settle = (b) => {
      const n = b.members.length, R = Math.sqrt(b.area / Math.PI);
      const r = Math.min(R / VISIBLE_FRACTION, 2.3 * R * Math.sqrt(Math.PI / n) * 0.95);
      const inner = Math.max(0, R - 0.42 * r);
      const slots = [];
      for (let k = 0; k < n; k++) {
        const rad = inner * Math.sqrt((k + 0.5) / n), a = k * GOLDEN_ANGLE;
        slots.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad, r });
      }
      const free = new Set(b.members);
      b.slots = new Map();
      for (let k = n - 1; k >= 0; k--) {
        let best = -1, bestD = Infinity;
        for (const i of free) {
          const d = (ox[i] - slots[k].x) ** 2 + (oy[i] - slots[k].y) ** 2;
          if (d < bestD) { bestD = d; best = i; }
        }
        free.delete(best);
        b.slots.set(best, slots[k]);
      }
    };
    const pullAt = (t) => PULLS.reduce((a, [t0, k]) => a + k * smooth((t - t0) / 0.5), 0);
    const relax = 1 - Math.exp(-DT / 0.16);
    for (let step = 0; step < steps; step++) {
      const t = SIM_START + step * DT;
      for (let i = 0; i < PARTICLES; i++) {
        const b = bodies[bodyOf[i]];
        const o = (step * PARTICLES + i) * 3;
        track[o] = b.x + ox[i]; track[o + 1] = b.y + oy[i]; track[o + 2] = pr[i];
      }
      const pull = pullAt(t);
      const damp = Math.exp(-(1.2 + 1.7 * Math.sqrt(pull)) * DT);
      const live = bodies.filter((b) => b.alive);
      for (const b of live) {
        const dx0 = b.x - cx, dy0 = b.y - cy;
        let ax = -pull * dx0 - 0.3 * pull * dy0, ay = -pull * dy0 + 0.3 * pull * dx0;
        for (const o of live) {
          if (o === b) continue;
          const dx = o.x - b.x, dy = o.y - b.y, d2 = dx * dx + dy * dy + 900;
          const g = (pull > 0 ? 260 : 0) * o.area / (d2 * Math.sqrt(d2));
          ax += g * dx; ay += g * dy;
        }
        const am = Math.hypot(ax, ay);
        if (am > 1400) { ax *= 1400 / am; ay *= 1400 / am; }
        b.vx = (b.vx + ax * DT) * damp; b.vy = (b.vy + ay * DT) * damp;
      }
      for (const b of live) { b.x += b.vx * DT; b.y += b.vy * DT; }
      for (let again = true; again;) {
        again = false;
        const alive = bodies.filter((b) => b.alive);
        search: for (let a = 0; a < alive.length; a++) {
          for (let c = a + 1; c < alive.length; c++) {
            const A = alive[a], C = alive[c];
            const reach = (Math.sqrt(A.area / Math.PI) + Math.sqrt(C.area / Math.PI)) * 0.92;
            if (Math.hypot(A.x - C.x, A.y - C.y) > reach) continue;
            // Merge C into A; world positions stay put, the drop re-centres and starts to round off.
            for (const i of A.members) { px[i] = A.x + ox[i]; py[i] = A.y + oy[i]; }
            for (const i of C.members) { px[i] = C.x + ox[i]; py[i] = C.y + oy[i]; }
            const total = A.area + C.area;
            A.vx = (A.vx * A.area + C.vx * C.area) / total; A.vy = (A.vy * A.area + C.vy * C.area) / total;
            A.area = total;
            const ai = bodies.indexOf(A);
            for (const i of C.members) bodyOf[i] = ai;
            A.members = A.members.concat(C.members);
            C.alive = false; C.members = [];
            recentre(A);
            settle(A);
            again = true;
            break search;
          }
        }
      }
      for (const b of bodies) {
        if (!b.alive || !b.slots) continue;
        for (const i of b.members) {
          const s = b.slots.get(i);
          ox[i] += (s.x - ox[i]) * relax; oy[i] += (s.y - oy[i]) * relax; pr[i] += (s.r - pr[i]) * relax;
        }
      }
    }
    const survivors = bodies.filter((b) => b.alive).length;
    console.assert(survivors === 1, `accretion left ${survivors} drops; strengthen the late pull`);
    return { track, steps, DT };
  }
  // ---------------------------------------------------------------- thought placement (plate units)
  const BUBBLE_CHARS_PER_UNIT = 0.079, BUBBLE_LINE = 25.5, BUBBLE_PAD = 27;  // measured at the 680 px column
  function speckThought(sp, dx, dy) {
    const e = [sp.x + dx * (sp.rho * 0.8 + 12), sp.y + dy * (sp.rho * 0.6 + 12)];
    return { e, a: [e[0] + dx * 34, e[1] + dy * 28], dir: [dx, dy] };
  }
  // The rectangle a bubble will cover, from its anchor, width and the length of its line.
  function bubbleBox(thought, chars, W) {
    const w = thought.width || BUBBLE_W;
    const lines = Math.ceil(chars / Math.max(8, Math.floor((w - BUBBLE_PAD) * BUBBLE_CHARS_PER_UNIT)));
    const h = lines * BUBBLE_LINE + BUBBLE_PAD;
    const [ax, ay] = thought.a, [dx, dy] = thought.dir;
    return { x0: dx > 0 ? ax : ax - w, x1: dx > 0 ? ax + w : ax, y0: dy > 0 ? ay : ay - h, y1: dy > 0 ? ay + h : ay };
  }
  function overlap(box, sp) {
    const m = sp.rho + 10;
    const ox = Math.max(0, Math.min(box.x1, sp.x + m) - Math.max(box.x0, sp.x - m));
    const oy = Math.max(0, Math.min(box.y1, sp.y + m) - Math.max(box.y0, sp.y - m));
    return ox * oy;
  }
  const BUBBLE_GAP = 28;            // clear space kept between bubbles up at the same time (their clouds are soft)
  const grow = (box, m) => ({ x0: box.x0 - m, x1: box.x1 + m, y0: box.y0 - m, y1: box.y1 + m });
  const boxOverlap = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  function outside(box, W) {
    return Math.max(0, 12 - box.x0) + Math.max(0, box.x1 - (W - 12)) + Math.max(0, 10 - box.y0) + Math.max(0, box.y1 - (INK_H - 10));
  }
  // ---------------------------------------------------------------- layout (depends on the aspect ratio)
  let L = null;
  function buildLayout(W) {
    const rng = mulberry32(7);
    const cx = W / 2, cy = W < NARROW_W ? INK_H * 0.6 : INK_H / 2;
    const { specks, kernels } = makeSpecks(W, rng);
    const marks = personaMarks(W, cy);
    const shapes = marks.map((m) => markKernels(m, rng, W));
    const textures = marks.map((m) => markTexture(m, W));
    const sim = simulateAccretion(specks, kernels, cx, cy);
    // The coalesced drop hands its kernels to the exact disc, then each mark hands them to the next.
    const last = sim.steps - 1;
    const simEnd = kernels.map((_, i) => ({ x: sim.track[(last * PARTICLES + i) * 3], y: sim.track[(last * PARTICLES + i) * 3 + 1] }));
    const slotOf = [matchPoints(simEnd, shapes[0])];
    for (let s = 1; s < shapes.length; s++) {
      slotOf.push(matchPoints(Array.from(slotOf[s - 1], (j) => shapes[s - 1][j]), shapes[s]));
    }
    // Back to the specks: any kernel may land on any home, since the ink is an unordered sum.
    const lastShape = shapes.length - 1;
    const homeOf = matchPoints(Array.from(slotOf[lastShape], (j) => shapes[lastShape][j]), kernels);
    // Documents: a mid-size speck in the document's zone, with the bubble direction that covers the least ink and
    // stays clear of the bubbles up at the same time.
    const candidates = specks.map((_, i) => i).filter((i) => specks[i].rho > 8);
    const documents = SCRIPT.filter((line) => line.probe !== undefined);
    const placed = [];
    const probeChoices = documents.map((line, k) => {
      const [lo, hi] = DOCUMENT_ZONES[k];
      const alongside = placed.filter((p) => p.line.t < line.end && line.t < p.line.end);
      let best = null;
      for (const si of candidates) {
        if (specks[si].x < lo * W || specks[si].x > hi * W || placed.some((p) => p.si === si)) continue;
        for (const dx of [1, -1]) {
          for (const dy of [-1, 1]) {
            const thought = speckThought(specks[si], dx, dy);
            const box = bubbleBox(thought, line.sample.length, W);
            const cost = specks.reduce((c, o, oi) => c + (oi === si ? 0 : overlap(box, o)), 0) + outside(box, W) * 1e6
              + alongside.reduce((c, p) => c + boxOverlap(grow(box, BUBBLE_GAP), p.box) * 1e3, 0);
            if (!best || cost < best.cost) best = { si, thought, box, cost };
          }
        }
      }
      console.assert(best, `no speck for document ${k}`);
      placed.push({ ...best, line });
      return best;
    });
    const probe = probeChoices.map((c) => c.si);
    const thoughts = { marks: marks.map((m) => m.thought), probes: probeChoices.map((c) => c.thought) };
    const wobble = marks.map((m) => m.wobble);
    return { W, cx, cy, specks, kernels, shapes, textures, wobble, sim, slotOf, homeOf, probe, thoughts };
  }
  // ---------------------------------------------------------------- state at time t
  const tmp = { x: 0, y: 0 };
  function speckFocus(si, t) {
    let f = smooth((t - L.specks[si].focusAt) / 2.2);
    for (const line of SCRIPT) {
      if (line.probe !== undefined && L.probe[line.probe] === si) {
        f = Math.max(f, 0.85 * smooth((t - line.t + 0.4) / 0.4) * (1 - smooth((t - line.end + 0.1) / 0.5)));
      }
    }
    return f;
  }
  // How far the drop has been pressed into the square: 0 to 1, accelerating.
  const pressAt = (t) => clamp01((t - SQUEEZE_START) / SQUEEZE_DUR) ** 3;
  // The square's size relative to its own: it dips by RECOIL on impact and springs back.
  function impactScale(t) {
    const v = (t - SQUEEZE_START - SQUEEZE_DUR) / RECOIL_DUR;
    if (v <= 0 || v >= 1 || t >= PERSONAS[0].start) return 1;
    return 1 - (RECOIL * Math.sin(Math.PI * v) * (1 - v)) / 0.58;  // 0.58: the peak of sin(pi v)(1 - v)
  }
  // Which exact shapes stand in for the kernels, and how much: {from, to, wFrom, wTo}.
  function shapeBlend(t) {
    const personaIndex = PERSONAS.findLastIndex((p) => t >= p.start);
    if (t >= RESET_START) {
      return { from: L.shapes.length - 1, to: 0, wFrom: 1 - smooth((t - RESET_START) / (RESET_DUR * 0.22)), wTo: 0 };
    }
    if (personaIndex >= 0) {
      const tau = (t - PERSONAS[personaIndex].start) / MORPH;
      return { from: personaIndex, to: personaIndex + 1, wFrom: 1 - smooth(tau / 0.2), wTo: smooth((tau - 0.66) / 0.34) };
    }
    return { from: 0, to: 0, wFrom: 0, wTo: smooth((pressAt(t) - 0.55) / 0.45) };
  }
  // Writes x, y, r, focus for every kernel into out (plate units).
  function kernelsAt(t, out) {
    const { kernels, shapes, sim, slotOf, homeOf, cx, cy } = L;
    const personaIndex = PERSONAS.findLastIndex((p) => t >= p.start);
    const simStep = clamp01((t - ASSIST_START) / ((SIM_END - SIM_START) * SIM_SLOWDOWN)) * (sim.steps - 1);
    const s0 = Math.floor(simStep), s1 = Math.min(sim.steps - 1, s0 + 1), sf = simStep - s0;
    const press = pressAt(t);
    for (let i = 0; i < PARTICLES; i++) {
      const k = kernels[i];
      let x, y, r, f = 1;
      if (t < ASSIST_START) {
        wobble(k, t, tmp);
        x = tmp.x; y = tmp.y; r = k.r; f = speckFocus(k.speck, t);
      } else if (personaIndex < 0) {
        const a = (s0 * PARTICLES + i) * 3, b = (s1 * PARTICLES + i) * 3;
        x = lerp(sim.track[a], sim.track[b], sf); y = lerp(sim.track[a + 1], sim.track[b + 1], sf); r = lerp(sim.track[a + 2], sim.track[b + 2], sf);
        if (press > 0) {
          const slot = shapes[0][slotOf[0][i]];
          x = lerp(x, slot.x, press); y = lerp(y, slot.y, press); r = lerp(r, slot.r, press);
        }
      } else if (t < RESET_START) {
        // A morph gathers the ink a little toward its centre on the way, as a drop re-forming would.
        const stage = personaIndex + 1;
        const from = shapes[stage - 1][slotOf[stage - 1][i]], to = shapes[stage][slotOf[stage][i]];
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        const delay = 0.24 * (1 - Math.min(1, dist / 260));
        const tau = clamp01((t - PERSONAS[personaIndex].start - delay) / (MORPH - 0.24));
        const s = smoother(tau), lift = Math.sin(Math.PI * s);
        const mx = lerp(from.x, to.x, s), my = lerp(from.y, to.y, s);
        const nx = -(to.y - from.y) / (dist || 1), ny = (to.x - from.x) / (dist || 1);
        x = mx + (cx - mx) * 0.55 * lift + nx * 0.04 * dist * lift;
        y = my + (cy - my) * 0.55 * lift + ny * 0.04 * dist * lift;
        r = lerp(from.r, to.r, s) * (1 + 0.1 * lift);
        f = lerp(from.f, to.f, s) - 0.12 * Math.sin(Math.PI * tau);
      } else {
        // The last mark scatters back into soft specks.
        const lastShape = shapes.length - 1;
        const from = shapes[lastShape][slotOf[lastShape][i]], home = kernels[homeOf[i]];
        const tau = clamp01((t - RESET_START) / RESET_DUR), s = smoother(tau);
        wobble(home, t, tmp);
        const burst = 0.22 * Math.sin(Math.PI * s);
        x = lerp(from.x + (from.x - cx) * burst, tmp.x, s); y = lerp(from.y + (from.y - cy) * burst, tmp.y, s);
        r = lerp(from.r, home.r, s);
        f = from.f * (1 - smooth(tau * 1.25));
      }
      out[i * 4] = x; out[i * 4 + 1] = y; out[i * 4 + 2] = r; out[i * 4 + 3] = f;
    }
    return out;
  }
  // ---------------------------------------------------------------- WebGL ink
  const gl = inkCanvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: true });
  if (!gl || !gl.getExtension("OES_standard_derivatives")) throw new Error("the ink needs WebGL with OES_standard_derivatives");
  const VERT = "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }";
  const FRAG = `
    #extension GL_OES_standard_derivatives : enable
    precision highp float;
    uniform vec4 u_k[${KERNELS}];
    uniform vec3 u_ink;
    uniform float u_iso, u_wFrom, u_wTo, u_sdfRange, u_sdfSlope, u_wobbleFrom, u_wobbleTo, u_scaleTo;
    uniform vec2 u_centre;  // the ink's centre, in texture coordinates
    uniform vec2 u_orbit;
    uniform vec2 u_plate;
    uniform float u_pxPerUnit;
    uniform sampler2D u_from, u_to;
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float vnoise(vec2 p) {
      vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    // The shape's field, drawn scale times its size about the centre, read a drifting distance (up to amp plate units)
    // away from this pixel.
    vec2 markField(sampler2D tex, vec2 uv, vec2 pu, float amp, float scale) {
      vec2 q = pu / ${WOBBLE_SCALE.toFixed(1)} + u_orbit;
      vec2 drift = amp * 2.0 * vec2(vnoise(q) - 0.5, vnoise(q + vec2(19.7, -7.3)) - 0.5);
      vec4 texel = texture2D(tex, u_centre + (uv - u_centre) / scale + vec2(drift.x, -drift.y) * u_pxPerUnit / u_plate);
      float d = (128.0 - texel.r * 255.0) * u_sdfRange / 127.0;
      return vec2(u_iso - d * u_sdfSlope, texel.a);
    }
    void main() {
      vec2 p = gl_FragCoord.xy;
      float wKernels = 1.0 - u_wFrom - u_wTo;
      float field = 0.0, focused = 0.0;
      if (wKernels > 0.001) {
        for (int i = 0; i < ${PARTICLES}; i++) {
          vec4 k = u_k[i];
          vec2 d = p - k.xy;
          float u2 = dot(d, d) / (k.z * k.z);
          if (u2 >= 1.0) continue;
          float a = 1.0 - u2;
          float v = a * a * a * mix(0.6, 1.0, k.w);
          field += v;
          focused += v * k.w;
        }
      }
      float kernelFocus = field > 1e-5 ? focused / field : 1.0;
      float trail = 0.0, trailFocused = 0.0;
      for (int i = ${PARTICLES}; i < ${KERNELS}; i++) {
        vec4 k = u_k[i];
        vec2 d = p - k.xy;
        float u2 = dot(d, d) / (k.z * k.z);
        if (u2 >= 1.0) continue;
        float a = 1.0 - u2;
        float v = a * a * a * mix(0.6, 1.0, k.w);
        trail += v;
        trailFocused += v * k.w;
      }
      vec2 uv = vec2(p.x / u_plate.x, 1.0 - p.y / u_plate.y);
      float total = field * wKernels, focus = kernelFocus * wKernels;
      vec2 pu = p / u_pxPerUnit;
      if (u_wFrom > 0.0) { vec2 m = markField(u_from, uv, pu, u_wobbleFrom, 1.0); total += m.x * u_wFrom; focus += m.y * u_wFrom; }
      if (u_wTo > 0.0) { vec2 m = markField(u_to, uv, pu, u_wobbleTo, u_scaleTo); total += m.x * u_wTo; focus += m.y * u_wTo; }
      // Far from a mark its shape field is strongly negative; clamp it so it cannot cancel the trail.
      total = max(total, 0.0);
      float trailShare = trail / (trail + total + 1e-5);
      focus = mix(focus, trail > 1e-5 ? trailFocused / trail : 0.0, trailShare);
      total += trail;
      total += 0.05 * (vnoise(pu / 4.0) - 0.5);
      float softness = mix(0.6, 0.2, wKernels) * (1.0 - focus) * (1.0 - focus);
      float band = max(fwidth(total) * 0.85, softness + 0.02);
      float mottle = 1.0 - 0.06 * vnoise(pu / 38.0);
      float alpha = smoothstep(u_iso - band, u_iso + band, total) * smoothstep(0.0, 1.0, focus) * mottle;
      gl_FragColor = vec4(u_ink * alpha, alpha);
    }`;
  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const uniform = (name) => gl.getUniformLocation(program, name);
  const uK = uniform("u_k"), uWFrom = uniform("u_wFrom"), uWTo = uniform("u_wTo"), uPlate = uniform("u_plate"), uPxPerUnit = uniform("u_pxPerUnit");
  const uWobbleFrom = uniform("u_wobbleFrom"), uWobbleTo = uniform("u_wobbleTo"), uOrbit = uniform("u_orbit");
  const uScaleTo = uniform("u_scaleTo");
  const uCentre = uniform("u_centre");
  gl.uniform3fv(uniform("u_ink"), INK_RGB);
  gl.uniform1f(uniform("u_iso"), ISO);
  gl.uniform1f(uniform("u_sdfRange"), SDF_RANGE);
  gl.uniform1f(uniform("u_sdfSlope"), SDF_SLOPE);
  gl.uniform1i(uniform("u_from"), 0);
  gl.uniform1i(uniform("u_to"), 1);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  let glTextures = [];
  function uploadTextures() {
    gl.uniform2f(uCentre, 0.5, L.cy / PLATE_H);
    for (const tex of glTextures) gl.deleteTexture(tex);
    glTextures = L.textures.map(({ tw, th, data }) => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, tw, th, 0, gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    });
  }
  const units = new Float32Array(PARTICLES * 4);
  const device = new Float32Array(KERNELS * 4 + 7);  // kernels, then the shape blend, the drift's orbit, the impact
  const lastDrawn = new Float32Array(KERNELS * 4 + 7);
  let scale = 1, dpr = 1, lastSize = "";
  function drawInk(t) {
    kernelsAt(t, units);
    const blend = shapeBlend(t);
    const hPx = inkCanvas.height;
    for (let i = 0; i < PARTICLES; i++) {
      const f = units[i * 4 + 3];
      device[i * 4] = units[i * 4] * scale * dpr;
      device[i * 4 + 1] = hPx - units[i * 4 + 1] * scale * dpr;
      device[i * 4 + 2] = units[i * 4 + 2] * (1 + 0.75 * (1 - f)) * scale * dpr;
      device[i * 4 + 3] = f;
    }
    const thoughts = thoughtsAt(t);
    console.assert(thoughts.length <= MAX_THOUGHTS, `${thoughts.length} thoughts at t=${t}; raise MAX_THOUGHTS`);
    for (let slot = 0; slot < MAX_THOUGHTS; slot++) {
      const thought = thoughts[slot];
      TRAIL.forEach(([along, radius], i) => {
        const o = (PARTICLES + slot * TRAIL.length + i) * 4, f = thought ? thought.trail[i] : 0;
        const end = thought && (thought.tail || thought.a);
        const x = thought ? lerp(thought.e[0], end[0], along) : 0, y = thought ? lerp(thought.e[1], end[1], along) : 0;
        device[o] = x * scale * dpr;
        device[o + 1] = hPx - y * scale * dpr;
        device[o + 2] = (radius / VISIBLE_FRACTION) * (1 + 0.75 * (1 - f)) * scale * dpr;
        device[o + 3] = f;
      });
    }
    const orbitAngle = (t / LOOP) * 2 * Math.PI;
    const orbit = [WOBBLE_ORBIT * Math.cos(orbitAngle), WOBBLE_ORBIT * Math.sin(orbitAngle)];
    const impact = impactScale(t);
    device.set([blend.from, blend.to, blend.wFrom, blend.wTo, ...orbit, impact], KERNELS * 4);
    const size = inkCanvas.width + "x" + hPx;
    if (size === lastSize && device.every((v, i) => Math.abs(v - lastDrawn[i]) < 1e-3)) return;
    lastDrawn.set(device); lastSize = size;
    gl.viewport(0, 0, inkCanvas.width, hPx);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, glTextures[blend.from]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, glTextures[blend.to]);
    gl.uniform1f(uWFrom, blend.wFrom);
    gl.uniform1f(uWTo, blend.wTo);
    gl.uniform1f(uWobbleFrom, L.wobble[blend.from]);
    gl.uniform1f(uWobbleTo, L.wobble[blend.to]);
    gl.uniform2f(uOrbit, orbit[0], orbit[1]);
    gl.uniform1f(uScaleTo, impact);
    gl.uniform2f(uPlate, inkCanvas.width, hPx);
    gl.uniform1f(uPxPerUnit, scale * dpr);
    gl.uniform4fv(uK, device.subarray(0, KERNELS * 4));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  // ---------------------------------------------------------------- thoughts, readout
  // The line that started last before time t: it owns the prompt caption.
  function lineAt(t) {
    const idx = SCRIPT.findLastIndex((e) => t >= e.t);
    const line = idx >= 0 ? SCRIPT[idx] : SCRIPT[SCRIPT.length - 1];
    const next = idx + 1 < SCRIPT.length ? SCRIPT[idx + 1].t : LOOP;
    const nextPrompt = idx + 1 < SCRIPT.length ? SCRIPT[idx + 1].prompt : "";
    return { line, next, nextPrompt };
  }
  // Each thought develops like the specks do: the trail's dots come into focus one by one from the mark outward, then
  // the bubble opens; it fades just before its line ends.
  function thoughtsAt(t) {
    return SCRIPT.filter((line) => line.sample && t >= line.sampleStart - 0.45 && t < line.end).map((line) => {
      const out = 1 - smooth((t - (line.end - 0.28)) / 0.26);
      return {
        ...(line.probe !== undefined ? L.thoughts.probes[line.probe] : L.thoughts.marks[line.mark]),
        line,
        trail: TRAIL.map((_, i) => smooth((t - (line.sampleStart - 0.42 + 0.11 * i)) / 0.28) * out),
        open: smooth((t - (line.sampleStart - 0.08)) / 0.2) * out,
      };
    });
  }
  const bubbleEls = [root.querySelector(".eh-bubble")];
  while (bubbleEls.length < MAX_THOUGHTS) bubbleEls.push(plate.insertBefore(bubbleEls[0].cloneNode(true), bubbleEls[0].nextSibling));
  const bubbles = bubbleEls.map((el) => ({
    el, said: el.querySelector(".eh-said"), unsaid: el.querySelector(".eh-unsaid"), cursor: el.querySelector(".eh-cursor"),
  }));
  let lastText = "";
  function drawReadout(t) {
    const { line, next, nextPrompt } = lineAt(t);
    const typed = (l) => l.sample.slice(0, Math.max(0, Math.floor((t - l.sampleStart) * TYPE_CPS)));
    const typing = (l) => t >= l.sampleStart && typed(l).length < l.sample.length;
    const blink = Math.floor(t / 0.53) % 2 === 0;
    const promptShown = line.retype ? line.prompt.slice(0, Math.floor((t - line.t) * PROMPT_CPS)) : line.prompt;
    // Captions show only what is on the plate now: each fades in when its span begins and out just before it ends.
    const shown = (a, b) => smooth((t - a) / 0.35) * (1 - smooth((t - (b - 0.3)) / 0.3));
    const stageSpans = [[0, PRE_END], [PRE_END, POST_END], [POST_END, RESET_START + 0.35]];
    const stageOpacity = stageSpans.map(([a, b]) => shown(a, b));
    const askOpacity = line.prompt && nextPrompt !== line.prompt ? 1 - smooth((t - (next - 0.3)) / 0.3) : line.prompt ? 1 : 0;
    // Once typed, only the newest thought keeps a blinking cursor; older ones just hold their line.
    const thoughts = thoughtsAt(t).map((th) => ({ ...th, said: typed(th.line), cursor: typing(th.line) || (th.line === line && blink) }));
    const key = `${promptShown}|${stageOpacity.map((o) => o.toFixed(3))}|${askOpacity.toFixed(3)}|`
      + thoughts.map((th) => `${th.open.toFixed(3)}${th.a}${th.said.length}${th.cursor}`).join(",");
    if (key === lastText) return;
    lastText = key;
    // The untyped rest is laid out invisibly, so the centred line keeps its place while it types.
    promptEl.textContent = promptShown;
    promptUnsaidEl.textContent = line.prompt.slice(promptShown.length);
    bubbles.forEach((bubble, slot) => {
      const thought = thoughts[slot];
      if (!thought) { bubble.el.style.opacity = "0"; return; }
      // The bubble opens away from the mark, from the point where the trail meets it.
      const [ax, ay] = thought.a, [dx, dy] = thought.dir;
      const b = bubble.el.style;
      b.width = `${(((thought.width || BUBBLE_W) / L.W) * 100).toFixed(3)}%`;
      b.left = dx > 0 ? `${((ax / L.W) * 100).toFixed(3)}%` : "auto";
      b.right = dx > 0 ? "auto" : `${(((L.W - ax) / L.W) * 100).toFixed(3)}%`;
      b.top = dy > 0 ? `${((ay / PLATE_H) * 100).toFixed(3)}%` : "auto";
      b.bottom = dy > 0 ? "auto" : `${(((PLATE_H - ay) / PLATE_H) * 100).toFixed(3)}%`;
      b.opacity = thought.open.toFixed(3);
      bubble.said.textContent = thought.said;
      bubble.unsaid.textContent = thought.line.sample.slice(thought.said.length);
      bubble.cursor.classList.toggle("off", !thought.cursor);
    });
    stageEls.forEach((el, i) => { el.style.opacity = stageOpacity[i].toFixed(3); });
    promptEl.parentElement.style.opacity = askOpacity.toFixed(3);
    askMarkEl.style.visibility = line.prompt ? "visible" : "hidden";
  }
  // ---------------------------------------------------------------- sizing and the clock
  function resize() {
    const rect = plate.getBoundingClientRect();
    if (rect.width === 0) return false;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(PLATE_H * rect.width / rect.height / 10) * 10;
    if (!L || L.W !== W) { L = buildLayout(W); uploadTextures(); }
    scale = rect.width / W;
    root.style.setProperty("--eh-unit", `${scale}px`);
    inkCanvas.width = Math.round(rect.width * dpr);
    inkCanvas.height = Math.round(rect.height * dpr);
    lastSize = "";
    return true;
  }
  function render(t) {
    drawInk(t);
    drawReadout(t);
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
  new ResizeObserver(() => { if (resize()) render(frozen ?? (reducedMotion ? POSTER_T : playhead)); }).observe(plate);
  if (!resize()) return;
  if (frozen !== null || reducedMotion) {
    render(frozen ?? POSTER_T);
    // A frozen page can be stepped from outside, for exporting frames: echoHero.render(t) for t in [0, echoHero.loop).
    if (frozen !== null) window.echoHero = { render, loop: LOOP };
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
})();

