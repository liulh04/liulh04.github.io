(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.querySelector(".hero-canvas");
  const hero = document.querySelector(".hero");

  if (canvas && hero && !reducedMotion.matches) {
    const context = canvas.getContext("2d", { alpha: true });
    const colors = ["#6be3b0", "#8ad8ee", "#ffc47a", "#f18c72"];
    const tasks = [
      { color: 0, delay: 0.1, points: [[0.61, 0.29], [0.89, 0.29], [0.89, 0.69], [0.61, 0.69], [0.61, 0.29]] },
      { color: 1, delay: 0.45, points: [[0.61, 0.4], [0.89, 0.4]] },
      { color: 2, delay: 0.8, points: [[0.61, 0.55], [0.89, 0.55]] },
      { color: 3, delay: 1.1, points: [[0.66, 0.59], [0.72, 0.5], [0.77, 0.54], [0.83, 0.43], [0.87, 0.47]] },
      { color: 0, delay: 1.45, points: [[0.69, 0.33], [0.69, 0.37], [0.72, 0.37]] },
      { color: 1, delay: 1.7, points: [[0.79, 0.33], [0.79, 0.37], [0.85, 0.37]] },
      { color: 2, delay: 2, points: [[0.58, 0.48], [0.53, 0.48], [0.53, 0.72], [0.92, 0.72], [0.92, 0.48]] },
    ];
    let width = 0;
    let height = 0;
    let frame = 0;
    let startedAt = 0;
    let stopped = false;

    const resize = () => {
      const bounds = hero.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawCursor = (x, y, color) => {
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 3, y + 17);
      context.lineTo(x + 7, y + 12);
      context.lineTo(x + 13, y + 17);
      context.lineTo(x + 16, y + 14);
      context.lineTo(x + 10, y + 9);
      context.lineTo(x + 16, y + 7);
      context.closePath();
      context.fillStyle = color;
      context.shadowColor = color;
      context.shadowBlur = 12;
      context.fill();
      context.shadowBlur = 0;
    };

    const draw = (now) => {
      if (stopped || document.hidden || reducedMotion.matches) return;
      if (!startedAt) startedAt = now;
      const elapsed = (now - startedAt) / 1000;
      context.clearRect(0, 0, width, height);

      for (const task of tasks) {
        const points = task.points.map(([x, y]) => [x * width, y * height]);
        const lengths = points.slice(1).map((point, index) => Math.hypot(point[0] - points[index][0], point[1] - points[index][1]));
        const totalLength = lengths.reduce((sum, length) => sum + length, 0);
        const progress = Math.max(0, Math.min(1, (elapsed - task.delay) / 1.15));
        const drawnLength = totalLength * progress;
        let remaining = drawnLength;
        let cursor = points[0];

        context.beginPath();
        context.moveTo(points[0][0], points[0][1]);
        for (let index = 0; index < lengths.length && remaining > 0; index += 1) {
          const from = points[index];
          const to = points[index + 1];
          const ratio = Math.min(1, remaining / lengths[index]);
          cursor = [from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio];
          context.lineTo(cursor[0], cursor[1]);
          remaining -= lengths[index];
        }
        context.strokeStyle = `${colors[task.color]}${progress >= 1 ? "91" : "75"}`;
        context.lineWidth = task.color === 0 ? 1.4 : 1;
        context.stroke();
        if (progress < 1) drawCursor(cursor[0], cursor[1], colors[task.color]);
      }

      if (elapsed < 4.8) frame = requestAnimationFrame(draw);
      else stopped = true;
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !startedAt && !document.hidden) frame = requestAnimationFrame(draw);
    }, { threshold: 0.2 });
    observer.observe(hero);
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(frame);
      else if (!stopped && startedAt) frame = requestAnimationFrame(draw);
    });
    reducedMotion.addEventListener?.("change", () => {
      if (reducedMotion.matches) {
        stopped = true;
        cancelAnimationFrame(frame);
        context.clearRect(0, 0, width, height);
      }
    });
    resize();
  }

  const revealItems = document.querySelectorAll("[data-reveal]");
  if (revealItems.length && "IntersectionObserver" in window && !reducedMotion.matches) {
    document.documentElement.classList.add("reveal-ready");
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealItems.forEach((item) => revealObserver.observe(item));
  }
})();
