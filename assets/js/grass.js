/* Original procedural ASCII field. Real text nodes; no image, video or WebGL. */
(() => {
  const settings = { maxColumns: 160, maxRows: 64, cellWidth: 9, fps: 12, speed: 0.45, density: 1 };
  function field(columns, rows, time = 0, density = settings.density) {
    const layers = Array.from({ length: 3 }, () => Array(rows * columns).fill(' '));
    const occupied = new Int8Array(rows * columns).fill(-1);
    let seed = 9721;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const count = Math.round(columns * rows * 0.11 * density);
    for (let blade = 0; blade < count; blade++) {
      const x = random();
      const horizon = 0.96 - 0.61 * x + 0.07 * Math.sin(x * 9);
      const y = horizon + random() * (1.15 - horizon);
      const length = (0.05 + random() * 0.19) * rows;
      const phase = random() * Math.PI * 2;
      const shade = random();
      const wind = 0.6 + Math.sin(time + x * 5 + y * 2) * 0.5 + Math.sin(time * 1.7 + phase) * 0.18;
      for (let step = 0; step <= length; step++) {
        const fraction = step / length;
        const curve = fraction * fraction;
        const col = Math.round(x * columns + wind * curve * length * 0.55);
        const row = Math.round(y * rows - step);
        if (col < 0 || col >= columns || row < 0 || row >= rows) continue;
        const light = fraction > 0.76 && shade > 0.65 ? 2 : shade > 0.45 ? 1 : 0;
        const index = row * columns + col;
        if (occupied[index] > light) continue;
        if (occupied[index] >= 0) layers[occupied[index]][index] = ' ';
        occupied[index] = light;
        const lean = wind * fraction;
        layers[light][index] = fraction > 0.92 ? "'" : lean > 0.35 ? '/' : lean < -0.2 ? '\\' : '|';
      }
    }
    return layers.map(layer => Array.from({ length: rows }, (_, row) => layer.slice(row * columns, (row + 1) * columns).join('')).join('\n'));
  }
  // Pure renderer is also used to generate the checked-in no-JS fallback and tests.
  if (typeof module !== 'undefined') module.exports = { field, settings };
  if (typeof document === 'undefined') return;
  document.querySelectorAll('[data-ascii-grass]').forEach(root => {
    const layers = [...root.querySelectorAll('.ascii-layer')];
    if (layers.length !== 3) return;
    const animated = root.dataset.animate === 'true';
    const button = animated ? document.querySelector('.motion') : null;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let columns = 90, rows = 32, frame = 0, time = 0, previous = 0;
    let visible = false, paused = false, disposed = false, suspended = false;
    function draw() {
      const text = field(columns, rows, time);
      layers.forEach((layer, index) => { layer.textContent = text[index]; });
    }
    function stop() { cancelAnimationFrame(frame); frame = 0; previous = 0; }
    function tick(now) {
      if (!previous) previous = now;
      if (now - previous >= 1000 / settings.fps) {
        time += Math.min(now - previous, 150) / 1000 * settings.speed;
        previous = now;
        draw();
      }
      frame = requestAnimationFrame(tick);
    }
    function update() {
      stop();
      if (disposed) return;
      if (button) {
        button.hidden = preference.matches;
        button.textContent = paused ? 'Play motion' : 'Pause motion';
        button.setAttribute('aria-pressed', String(paused));
      }
      if (preference.matches) { time = 0; draw(); }
      if (animated && visible && !document.hidden && !preference.matches && !paused && !suspended) frame = requestAnimationFrame(tick);
    }
    function resize() {
      const width = root.clientWidth, height = root.clientHeight;
      if (!width || !height) return;
      columns = Math.max(24, Math.min(settings.maxColumns, Math.round(width / settings.cellWidth)));
      rows = Math.max(12, Math.min(settings.maxRows, Math.round(height / (width / columns * 1.65))));
      root.style.setProperty('--ascii-size', width / columns / 0.6 + 'px');
      root.style.setProperty('--ascii-leading', height / rows + 'px');
      draw();
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    const sizes = new ResizeObserver(resize);
    const toggle = () => { paused = !paused; update(); };
    const hide = event => {
      suspended = true; stop();
      if (event.persisted) return;
      disposed = true; observer.disconnect(); sizes.disconnect();
      document.removeEventListener('visibilitychange', update);
      preference.removeEventListener('change', update);
      button?.removeEventListener('click', toggle);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('pageshow', show);
    };
    const show = () => { suspended = false; update(); };
    resize(); observer.observe(root); sizes.observe(root);
    button?.addEventListener('click', toggle);
    document.addEventListener('visibilitychange', update);
    preference.addEventListener('change', update);
    window.addEventListener('pagehide', hide);
    window.addEventListener('pageshow', show);
    update();
  });
})();
