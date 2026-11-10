// Needs: npm i playwright-core@1.64.1 ffmpeg-static@5.3.0 (in any folder), and Google Chrome installed.
// Records animation.html frame by frame with the local Chrome, then encodes MP4 + GIF with ffmpeg.
// Usage: node render.cjs <animation.html> <outDir> [fps=30] [size=1080] [stillsOnly=0]
const { chromium } = require('playwright-core');
const ffmpeg = require('ffmpeg-static');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const [html, outDir, fpsArg = '30', sizeArg = '1080', stills = '0'] = process.argv.slice(2);
  const fps = +fpsArg, size = +sizeArg;
  const frames = path.join(__dirname, 'frames');
  fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.resolve(html)).href + '?capture=1');
  await page.evaluate(() => window.ready);
  const duration = await page.evaluate(() => window.DURATION);

  if (stills === '1') {
    for (const t of [0.75, 2.1, 2.75, 3.05, 3.7, 5.3, 6.2, 7.5, 9.15, 10.4, 13.0]) {
      await page.evaluate((x) => window.renderAt(x), t);
      await page.screenshot({ path: path.join(outDir, `still-${String(t).replace('.', '_')}.png`) });
    }
    await browser.close();
    console.log('stills written');
    return;
  }

  const total = Math.round(duration * fps);
  for (let i = 0; i <= total; i++) {
    await page.evaluate((x) => window.renderAt(x), i / fps);
    await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.png`) });
  }
  await browser.close();
  console.log(`captured ${total + 1} frames`);

  const input = path.join(frames, 'f%04d.png');
  const mp4 = path.join(outDir, 'faithway-logo-animation.mp4');
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', input,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
  const gif = path.join(outDir, 'faithway-logo-animation.gif');
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', input,
    '-vf', 'fps=20,scale=600:600:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle',
    '-loop', '0', gif]);
  for (const f of [mp4, gif]) console.log(path.basename(f), (fs.statSync(f).size / 1e6).toFixed(2), 'MB');
})().catch((e) => { console.error(e); process.exit(1); });
