# Faithway logo animation

- `faithway-logo-animation.mp4`: 1080×1080, 30 fps, 8 s (logo builds in ~4 s, name + tagline by ~5.75 s, then holds; good for video intros/outros)
- `faithway-logo-animation.gif`: 600×600, 20 fps, 8 s, loops

Every shape is traced from the original artwork (`../logo-full.jpg`), so the finished frame matches the logo
(97.6% pixel overlap, 98.4% on the mark).

To rebuild:
1. `uv run --with potracer --with pillow --with numpy --with scipy python -I trace_logo.py ../logo-full.jpg .`
   (writes `logo-parts.json`)
2. `node build_animation.mjs` (writes `animation.html`; open it in a browser for a live preview)
3. `node render.cjs animation.html .` (records the MP4 + GIF)

Timing and colours live in `animation.template.html`.
