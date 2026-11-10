// Builds animation.html from animation.template.html + logo-parts.json (written by trace_logo.py).
// Usage: node build_animation.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const parts = JSON.parse(readFileSync(join(here, 'logo-parts.json'), 'utf8'));
const html = readFileSync(join(here, 'animation.template.html'), 'utf8').replace('__PARTS__', JSON.stringify(parts));
writeFileSync(join(here, 'animation.html'), html);
console.log(`animation.html written (${(html.length / 1024).toFixed(0)} KB)`);
