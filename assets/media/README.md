# ASCII grass background

The live background is original procedural JavaScript, not a video, image filter or WebGL effect.
assets/js/grass.js creates three text grids from deterministic grass stems and wind curves.
The displayed strokes are real ASCII characters in HTML pre elements, tinted green and pale gold.

Settings at the top of grass.js control density, speed, fps (12), maxColumns (160),
maxRows (64), and cellWidth (9). Colors are CSS variables in assets/css/ascii-grass.css.
Composition masks and placement remain in home.css and ascii-grass.css.
The homepage animates; reading and tool pages render one static frame.

_includes/ascii-grass.html contains the same renderer's phase-zero text as a no-JS fallback.
Reduced motion renders a still frame. Hidden or offscreen pages pause requestAnimationFrame.
The pause button is keyboard accessible. pagehide cleanup disconnects observers and listeners;
bfcache restoration resumes only when appropriate. No global key handlers are installed.

The previous living-ascii video assets have been removed. The upstream implementation was
reviewed as a visual reference; no upstream renderer code is copied. Its historical MIT
notice is retained in living-ascii-LICENSE.txt for attribution of the previous release.

Name/contact: _config.yml. Homepage copy: _layouts/home.html.
Shared page theme: assets/css/site-theme.css. Routes and article data are unchanged.
Rollback baseline for the live-text change: 9669123dc9731e95dac3bf45c0a4d1f5de55ddf1.
Revert the live-text PR through a new PR and allow the existing master workflow to deploy.
