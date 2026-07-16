const scene = document.querySelector(".scene-frame");

if (scene) {
  const canvas = scene.querySelector(".scene-particles");
  const pet = scene.querySelector(".codex-pet");
  const shell = scene.querySelector(".pet-shell");
  const context = canvas.getContext("2d", { alpha: true });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const colors = ["#91f2e6", "#d9f7a3", "#f7d99a", "#7fc9e8", "#f3f1ed"];
  let particles = [];
  let width = 0;
  let height = 0;
  let active = false;
  let pointer = { x: 0.5, y: 0.5 };
  let petOffset = 0;
  let petDirection = 1;

  const makeParticle = (burst = false, origin = pointer) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = burst ? 0.7 + Math.random() * 2.2 : 0.08 + Math.random() * 0.25;
    return {
      x: burst ? origin.x * width : Math.random() * width,
      y: burst ? origin.y * height : Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (burst ? 0.5 : 0.08),
      life: burst ? 45 + Math.random() * 50 : 90 + Math.random() * 150,
      size: Math.random() > 0.82 ? 3 : 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      twinkle: Math.random() > 0.78,
    };
  };

  const resize = () => {
    const rect = scene.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!particles.length) particles = Array.from({ length: 38 }, () => makeParticle());
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    for (const particle of particles) {
      if (!reducedMotion) {
        if (active) {
          const dx = pointer.x * width - particle.x;
          const dy = pointer.y * height - particle.y;
          const distance = Math.max(Math.hypot(dx, dy), 36);
          particle.vx += (-dy / distance) * 0.0028;
          particle.vy += (dx / distance) * 0.0028;
        }
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.994;
        particle.vy *= 0.994;
        particle.life -= 1;
      }

      const alpha = Math.min(1, particle.life / 28) * (active ? 0.92 : 0.48);
      context.globalAlpha = Math.max(0, alpha);
      context.fillStyle = particle.color;
      const x = Math.round(particle.x);
      const y = Math.round(particle.y);
      context.fillRect(x, y, particle.size, particle.size);
      if (particle.twinkle && particle.life % 20 < 9) {
        context.fillRect(x - particle.size, y + 1, particle.size * 3, 1);
        context.fillRect(x + 1, y - particle.size, 1, particle.size * 3);
      }

      if (particle.life <= 0 || particle.x < -12 || particle.x > width + 12 || particle.y < -12 || particle.y > height + 12) {
        Object.assign(particle, makeParticle(false));
      }
    }
    context.globalAlpha = 1;
    if (!reducedMotion) requestAnimationFrame(draw);
  };

  const setPointer = (event) => {
    const rect = scene.getBoundingClientRect();
    pointer = {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
  };

  scene.addEventListener("pointerenter", (event) => {
    active = true;
    setPointer(event);
    scene.classList.add("is-hovered");
  });
  scene.addEventListener("pointermove", setPointer);
  scene.addEventListener("pointerleave", () => {
    active = false;
    scene.classList.remove("is-hovered");
  });

  scene.addEventListener("click", (event) => {
    setPointer(event);
    particles.push(...Array.from({ length: reducedMotion ? 8 : 42 }, () => makeParticle(true)));
    if (particles.length > 140) particles.splice(0, particles.length - 140);
    if (reducedMotion) draw();
    scene.classList.remove("is-shaking");
    shell.classList.remove("is-moving");
    void scene.offsetWidth;
    scene.classList.add("is-shaking");
    shell.classList.add("is-moving");

    petOffset += petDirection * (8 + Math.round(Math.random() * 6));
    if (petOffset > 16) {
      petOffset = 16;
      petDirection = -1;
    } else if (petOffset < -28) {
      petOffset = -28;
      petDirection = 1;
    }
    pet.style.setProperty("--pet-x", `${petOffset}px`);
  });

  scene.addEventListener("animationend", () => scene.classList.remove("is-shaking"));
  shell.addEventListener("animationend", () => shell.classList.remove("is-moving"));
  new ResizeObserver(resize).observe(scene);
  resize();
  draw();
}
