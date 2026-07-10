export function initCanvasBg(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  let w: number;
  let h: number;
  let animId: number;
  let lastFrame = 0;
  const FRAME_INTERVAL = 1000 / 40;

  const rays: { speed: number; width: number; hue: number; offset: number }[] = [];
  for (let i = 0; i < 18; i++) {
    rays.push({
      speed: 0.2 + Math.random() * 0.3,
      width: 2 + Math.random() * 6,
      hue: 220 + Math.random() * 60,
      offset: Math.random() * 1000,
    });
  }

  const auroras: {
    x: number;
    y: number;
    r: number;
    hue: number;
    speed: number;
    phase: number;
  }[] = [];
  for (let i = 0; i < 5; i++) {
    auroras.push({
      x: Math.random() * 2000,
      y: Math.random() * 1000,
      r: 200 + Math.random() * 300,
      hue: 220 + Math.random() * 80,
      speed: 0.1 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.scale(dpr, dpr);
  }

  function draw(t: number) {
    if (t - lastFrame < FRAME_INTERVAL) {
      animId = requestAnimationFrame(draw);
      return;
    }
    lastFrame = t;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const ray of rays) {
      ctx.beginPath();
      ctx.moveTo(0, h);
      const yy = (Math.sin(t * ray.speed * 0.001 + ray.offset) * 0.5 + 0.5) * h * 0.6 + h * 0.2;
      ctx.lineTo(w, yy);
      ctx.strokeStyle = `hsla(${ray.hue + Math.sin(t * 0.0005) * 20}, 70%, 60%, 0.06)`;
      ctx.lineWidth = ray.width;
      ctx.stroke();
    }
    ctx.restore();

    for (const a of auroras) {
      const cx = a.x + Math.sin(t * a.speed * 0.0005 + a.phase) * 200;
      const cy = a.y + Math.cos(t * a.speed * 0.0003 + a.phase) * 150;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, a.r);
      gradient.addColorStop(0, `hsla(${a.hue + Math.sin(t * 0.0008 + a.phase) * 30}, 80%, 60%, 0.12)`);
      gradient.addColorStop(0.5, `hsla(${a.hue + 20}, 60%, 40%, 0.06)`);
      gradient.addColorStop(1, `hsla(${a.hue + 40}, 40%, 20%, 0)`);
      ctx.save();
      ctx.shadowBlur = 80;
      ctx.shadowColor = `hsla(${a.hue}, 80%, 60%, 0.15)`;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9);
    vignette.addColorStop(0, "transparent");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.4)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    animId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  animId = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener("resize", resize);
  };
}
