(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.querySelector(".hero-canvas");
  const visual = document.querySelector(".hero-visual");

  if (canvas && visual && !reducedMotion.matches) {
    const context = canvas.getContext("2d", { alpha: true });
    const colors = ["#d0f36a", "#5cdbaf", "#78cce6", "#f39375"];
    const nodes = [
      [.11, .19], [.34, .13], [.68, .16], [.89, .22],
      [.13, .48], [.38, .42], [.66, .48], [.88, .52],
      [.16, .79], [.4, .84], [.68, .8], [.9, .82],
    ];
    const edges = [
      [0, 1], [1, 2], [2, 3], [0, 4], [1, 4], [1, 5],
      [2, 5], [2, 6], [3, 6], [3, 7], [4, 5], [5, 6],
      [6, 7], [4, 8], [4, 9], [5, 9], [5, 10], [6, 10],
      [6, 11], [7, 11], [8, 9], [9, 10], [10, 11],
    ];
    let width = 0;
    let height = 0;
    let frame = 0;
    let startedAt = 0;
    let inView = false;

    const resize = () => {
      const bounds = visual.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const pointAt = (index, elapsed) => {
      const [x, y] = nodes[index];
      const phase = elapsed * .65 + index * 1.7;
      return [x * width + Math.sin(phase) * 2.2, y * height + Math.cos(phase * .8) * 2.2];
    };

    const drawCursor = (x, y, color) => {
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 3, y + 13);
      context.lineTo(x + 6, y + 9);
      context.lineTo(x + 11, y + 13);
      context.lineTo(x + 13, y + 11);
      context.lineTo(x + 8, y + 7);
      context.lineTo(x + 13, y + 5);
      context.closePath();
      context.fillStyle = color;
      context.shadowColor = color;
      context.shadowBlur = 11;
      context.fill();
      context.shadowBlur = 0;
    };

    const draw = (now) => {
      if (!inView || document.hidden || reducedMotion.matches) return;
      if (!startedAt) startedAt = now;
      const elapsed = (now - startedAt) / 1000;
      context.clearRect(0, 0, width, height);

      edges.forEach(([fromIndex, toIndex], index) => {
        const from = pointAt(fromIndex, elapsed);
        const to = pointAt(toIndex, elapsed);
        const progress = Math.max(0, Math.min(1, (elapsed - index * .105) / .46));
        if (progress <= 0) return;
        const current = [from[0] + (to[0] - from[0]) * progress, from[1] + (to[1] - from[1]) * progress];

        context.beginPath();
        context.moveTo(from[0], from[1]);
        context.lineTo(current[0], current[1]);
        context.lineWidth = 1;
        context.strokeStyle = colors[(fromIndex + toIndex) % colors.length];
        context.globalAlpha = progress < 1 ? .82 : .48;
        context.stroke();
        context.globalAlpha = 1;
        if (progress < 1) drawCursor(current[0], current[1], colors[(fromIndex + toIndex) % colors.length]);
      });

      nodes.forEach((_, index) => {
        const [x, y] = pointAt(index, elapsed);
        const phase = elapsed * 2.4 + index;
        const radius = 2.2 + (Math.sin(phase) + 1) * .65;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = colors[index % colors.length];
        context.shadowColor = colors[index % colors.length];
        context.shadowBlur = 10;
        context.globalAlpha = Math.min(.9, elapsed + .2);
        context.fill();
        context.globalAlpha = 1;
        context.shadowBlur = 0;
      });

      frame = requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView && !document.hidden) frame = requestAnimationFrame(draw);
      else cancelAnimationFrame(frame);
    }, { threshold: .2 });
    observer.observe(visual);
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(frame);
      else if (inView) frame = requestAnimationFrame(draw);
    });
    reducedMotion.addEventListener?.("change", () => {
      if (reducedMotion.matches) {
        inView = false;
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
    }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
    revealItems.forEach((item) => revealObserver.observe(item));
  }
})();
