// Builds the GitHub Pages site in docs/ from the working preview in prototype/.
// - prototype/index.html is written without <html>/<head>/<body> (the artifact viewer adds them),
//   so it is wrapped in a full document with the public title and a noindex tag.
// - data, map, images and missionary photos are copied across. Only photos listed in
//   sprite-order.json (visible missionaries, written by data.mjs) are copied, so a hidden
//   missionary's photo can never reach docs/ even if it is lying around in prototype/photos.
// - also writes the app manifest ("Add to home screen"), the "page not found" page and robots.txt.
// Usage: node scripts/build-docs.mjs [prototypeDir] [docsDir]
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync, cpSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ogTags, DESCRIPTION, SITE, ANALYTICS_TOKEN } from './site.mjs';

const [src = 'prototype', dst = 'docs'] = process.argv.slice(2);

// tab icon, home-screen icon and app manifest; visitor counts (Cloudflare Web Analytics: no cookies,
// no personal data) switch on once a token is set in scripts/site.mjs
const appTags = (base = '') => `<link rel="icon" type="image/png" sizes="48x48" href="${base}img/icons/favicon-48.png">
<link rel="apple-touch-icon" href="${base}img/icons/apple-touch-icon.png">
<link rel="manifest" href="${base}manifest.webmanifest">
<meta name="theme-color" content="#086288">`;
const analytics = ANALYTICS_TOKEN
  ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${ANALYTICS_TOKEN}"}'></script>`
  : '';

let body = readFileSync(join(src, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
body = body
  .replace('<title>Faithway Website Preview</title>', '<title>Faithway Bible Baptist Church</title>')
  .replace(/<meta name="claude:viewport-fit-sides"[^>]*>\n?/, '');
const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="${DESCRIPTION}">
${ogTags({ title: 'Faithway Bible Baptist Church · Puerto Princesa City' })}
${appTags()}
${analytics}
<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
`;
const cut = body.indexOf('</style>') + '</style>'.length;
mkdirSync(dst, { recursive: true });
writeFileSync(join(dst, 'index.html'), `${head}${body.slice(0, cut)}\n</head>\n<body>\n${body.slice(cut)}\n</body>\n</html>\n`);

for (const f of ['map.js', 'missionaries.js', 'thumbs.jpg', 'logo.jpg']) copyFileSync(join(src, f), join(dst, f));
// extra standalone pages (complete HTML documents), e.g. kings-and-prophets.html
// each gets the share-preview tags (title from its <title>), icons and analytics unless it already has them
for (const f of readdirSync(src).filter((n) => n.endsWith('.html') && n !== 'index.html')) {
  let page = readFileSync(join(src, f), 'utf8').replace(/<link rel="icon" href="logo\.jpg">\r?\n?/, '');   // replaced by the proper icons below
  const title = (/<title>([^<]*)<\/title>/.exec(page) || [])[1] || 'Faithway Bible Baptist Church';
  if (!page.includes('og:title')) page = page.replace('</title>', `</title>\n${ogTags({ title, url: f })}\n${appTags()}\n${analytics}`);
  writeFileSync(join(dst, f), page);
}

// app manifest: lets members add the site to their phone's home screen with the church icon
writeFileSync(join(dst, 'manifest.webmanifest'), JSON.stringify({
  name: 'Faithway Bible Baptist Church', short_name: 'Faithway', description: DESCRIPTION,
  start_url: './', scope: './', display: 'standalone', background_color: '#FFFCF5', theme_color: '#086288',
  icons: [192, 512].map((n) => ({ src: `img/icons/icon-${n}.png`, sizes: `${n}x${n}`, type: 'image/png', purpose: 'any maskable' })),
}, null, 1));

// "page not found": GitHub Pages shows docs/404.html for any missing address, at any depth, so its links are absolute
writeFileSync(join(dst, '404.html'), `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Page not found · Faithway Bible Baptist Church</title>
${appTags(SITE)}
${analytics}
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Montserrat:wght@400;600&display=swap" rel="stylesheet">
<style>
body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #086288; color: #FFEFC4; font: 400 1rem/1.6 Montserrat, system-ui, sans-serif; text-align: center; padding: 24px; box-sizing: border-box; }
img { width: 150px; height: auto; }
h1 { font: 600 clamp(2rem, 6vw, 3rem)/1.1 'Cormorant Garamond', Georgia, serif; color: #fff; margin: 22px 0 8px; }
p { margin: 0 auto 26px; max-width: 34ch; color: #CFEBFF; }
a { display: inline-block; padding: 13px 24px; border-radius: 999px; background: #FFEFC4; color: #05445F; font-weight: 600; text-decoration: none; margin: 4px; }
a.ghost { background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,.55); }
</style>
</head><body><main>
<img src="${SITE}img/logo-full-white.png" alt="Palawan Faithway Bible Baptist Church" width="1424" height="1560">
<h1>This page isn’t here</h1>
<p>The link may be old or mistyped. Everything is on our home page.</p>
<a href="${SITE}">Go to the home page</a><a class="ghost" href="${SITE}#visit">Service times and map</a>
</main></body></html>
`);

rmSync(join(dst, 'img'), { recursive: true, force: true });
cpSync(join(src, 'img'), join(dst, 'img'), { recursive: true });   // church photos + img/events/<slug>/

const visible = JSON.parse(readFileSync(join(src, 'sprite-order.json'), 'utf8'));
rmSync(join(dst, 'photos'), { recursive: true, force: true });
mkdirSync(join(dst, 'photos'));
for (const card of visible) {
  const p = join(src, 'photos', `${card}.jpg`);
  if (existsSync(p)) copyFileSync(p, join(dst, 'photos', `${card}.jpg`));
}
// hidden from search engines while under review, but link-preview bots (Facebook, Messenger, Viber...) may read pages.
// When the church goes public, replace this with an empty robots.txt (see README).
writeFileSync(join(dst, 'robots.txt'), ['facebookexternalhit', 'Facebot', 'Twitterbot', 'WhatsApp', 'TelegramBot', 'Viber', 'Discordbot']
  .map((b) => `User-agent: ${b}`).join('\n') + '\nAllow: /\n\nUser-agent: *\nDisallow: /\n');
if (!existsSync(join(dst, '.nojekyll'))) writeFileSync(join(dst, '.nojekyll'), '');
console.log(`built ${dst}/ from ${src}/ (${visible.length} missionary photos)`);
