/* Decorative video only: no global keyboard handlers or rendering dependencies. */
(() => {
  const video = document.querySelector('.grass video');
  const button = document.querySelector('.motion');
  if (!video || !button) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, paused = false, failed = false, disposed = false;
  const update = () => {
    if (disposed) return;
    const play = visible && !document.hidden && !preference.matches && !paused && !failed;
    button.hidden = preference.matches || failed;
    button.textContent = paused ? 'Play motion' : 'Pause motion';
    button.setAttribute('aria-pressed', String(paused));
    if (!play) { video.pause(); if (preference.matches) video.classList.remove('is-playing'); return; }
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    video.playbackRate = 0.7;
    video.play().catch(() => { if (!disposed && visible && !document.hidden && !preference.matches && !paused) { paused = true; update(); } });
  };
  const playing = () => video.classList.add('is-playing');
  const error = () => { failed = true; video.classList.remove('is-playing'); update(); };
  const toggle = () => { paused = !paused; update(); };
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
  const cleanup = (event) => {
    video.pause();
    if (event.persisted) return;
    disposed = true; observer.disconnect();
    document.removeEventListener('visibilitychange', update);
    preference.removeEventListener('change', update);
    button.removeEventListener('click', toggle);
    video.removeEventListener('playing', playing);
    video.removeEventListener('error', error);
    window.removeEventListener('pagehide', cleanup);
    window.removeEventListener('pageshow', update);
    video.removeAttribute('src'); video.load();
  };
  observer.observe(document.querySelector('.landing'));
  document.addEventListener('visibilitychange', update);
  preference.addEventListener('change', update);
  button.addEventListener('click', toggle);
  video.addEventListener('playing', playing);
  video.addEventListener('error', error);
  window.addEventListener('pagehide', cleanup);
  window.addEventListener('pageshow', update);
})();
