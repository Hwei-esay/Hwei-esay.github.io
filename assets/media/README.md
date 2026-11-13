# Homepage grass background

Source: https://github.com/yusen-dev/living-ascii/releases/tag/wallpapers-v1
Original: grass-desktop-4k.mp4 (12 seconds, 3840 × 2160, 30 fps).
Copyright (c) 2026 Yusen. MIT license: living-ascii-LICENSE.txt.

The upstream src/main.js and src/post.js were inspected before choosing video:
the interactive demo includes multiple WebGL passes, export endpoints and global
keyboard handlers. This static Jekyll site only needs the resulting decoration.
No upstream JavaScript, Three.js, FFmpeg or export server is a runtime dependency.

grass.mp4 is a 1600 × 900 H.264/yuv420p derivative with no audio and faststart.
Conversion filter: scale=1600:-2,hue=s=0,eq=contrast=1.8:brightness=-0.18,format=yuv420p
Encoder settings: libx264, preset medium, crf 28; poster is frame 0, JPEG quality 2.
The original 166 MiB video and conversion tools are not published.

Edit assets/css/home.css for colors, brightness, masks, visible area and responsive
layout. Edit playbackRate (currently 0.7) in assets/js/grass.js for speed.
Stroke density is baked into the source video; changing it requires a new export
with upstream density and output-size parameters, followed by replacing both assets.
The image remains visible if JS, autoplay or video decoding fails. Reduced motion
does not load the video. Offscreen/hidden pages pause it. A keyboard-accessible
button also allows visitors to pause motion.

Name and contact links come from _config.yml (author.name and social).
Intro and primary navigation live in _layouts/home.html. Collection links come
from _data/sections.yml. All local URLs pass through relative_url.

Deployment: existing Jekyll GitHub Actions on master, output _site. PR builds run
the same validation and build without deploying. Before this redesign the verified
production SHA was 863e23bd85ad183794e7871141fd956218c89f45, run 38903952887.
Rollback by reverting the redesign PR on a new branch, reviewing/merging the revert
into master, and waiting for the existing Pages deployment. Do not force-push.
