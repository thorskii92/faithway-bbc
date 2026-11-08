// Builds docs/index.html (the GitHub Pages site) from the working preview page.
// The preview is written without <html>/<head>/<body> (the artifact viewer adds them),
// so this wraps it in a full document, sets the public title and adds noindex.
// Usage: node scripts/build-docs.mjs <preview/index.html> <docs/index.html>
import { readFileSync, writeFileSync } from 'node:fs';

const [src, dst] = process.argv.slice(2);
let body = readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
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
writeFileSync(dst, `${head}${body.slice(0, cut)}\n</head>\n<body>\n${body.slice(cut)}\n</body>\n</html>\n`);
console.log('built', dst);
