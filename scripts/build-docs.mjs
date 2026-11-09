// Builds the GitHub Pages site in docs/ from the working preview in prototype/.
// - prototype/index.html is written without <html>/<head>/<body> (the artifact viewer adds them),
//   so it is wrapped in a full document with the public title and a noindex tag.
// - data, map, images and missionary photos are copied across. Only photos listed in
//   sprite-order.json (visible missionaries, written by data.mjs) are copied, so a hidden
//   missionary's photo can never reach docs/ even if it is lying around in prototype/photos.
// Usage: node scripts/build-docs.mjs [prototypeDir] [docsDir]
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync, cpSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const [src = 'prototype', dst = 'docs'] = process.argv.slice(2);

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
<meta name="description" content="Palawan Faithway Bible Baptist Church, Inc. Purok Matapat, San Jose, Puerto Princesa City. Passion for God. Compassion to People.">
<link rel="icon" href="logo.jpg">
<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
`;
const cut = body.indexOf('</style>') + '</style>'.length;
mkdirSync(dst, { recursive: true });
writeFileSync(join(dst, 'index.html'), `${head}${body.slice(0, cut)}\n</head>\n<body>\n${body.slice(cut)}\n</body>\n</html>\n`);

for (const f of ['map.js', 'missionaries.js', 'thumbs.jpg', 'logo.jpg']) copyFileSync(join(src, f), join(dst, f));
// extra standalone pages (complete HTML documents), e.g. kings-and-prophets.html
for (const f of readdirSync(src).filter((n) => n.endsWith('.html') && n !== 'index.html')) copyFileSync(join(src, f), join(dst, f));

rmSync(join(dst, 'img'), { recursive: true, force: true });
cpSync(join(src, 'img'), join(dst, 'img'), { recursive: true });   // church photos + img/events/<slug>/

const visible = JSON.parse(readFileSync(join(src, 'sprite-order.json'), 'utf8'));
rmSync(join(dst, 'photos'), { recursive: true, force: true });
mkdirSync(join(dst, 'photos'));
for (const card of visible) {
  const p = join(src, 'photos', `${card}.jpg`);
  if (existsSync(p)) copyFileSync(p, join(dst, 'photos', `${card}.jpg`));
}
if (!existsSync(join(dst, 'robots.txt'))) writeFileSync(join(dst, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
if (!existsSync(join(dst, '.nojekyll'))) writeFileSync(join(dst, '.nojekyll'), '');
console.log(`built ${dst}/ from ${src}/ (${visible.length} missionary photos)`);
