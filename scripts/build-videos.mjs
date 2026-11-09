// Builds <out>/videos.json from content/videos/*.yml (YouTube videos saved in the /admin editor).
// Usage: node scripts/build-videos.mjs [outDir=docs]
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import YAML from 'yaml';

const out = process.argv[2] || 'docs';
const SRC = 'content/videos';
const TYPES = ['cantata', 'choir', 'special', 'congregational', 'other'];

// accepts youtu.be/ID, youtube.com/watch?v=ID, /shorts/ID, /embed/ID, /live/ID, or a bare 11-character ID
export function youtubeId(url) {
  const s = String(url || '').trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|[?&]v=|\/(?:shorts|embed|live|v)\/)([\w-]{11})/);
  return m ? m[1] : null;
}

const videos = [];
if (existsSync(SRC)) {
  for (const f of readdirSync(SRC).filter((n) => /\.ya?ml$/i.test(n))) {
    let d;
    try { d = YAML.parse(readFileSync(join(SRC, f), 'utf8')) || {}; } catch { console.warn(`warning: ${f}: not valid YAML`); continue; }
    if (d.draft) continue;
    const yt = youtubeId(d.youtube);
    const date = d.date instanceof Date ? d.date.toISOString().slice(0, 10) : String(d.date || '').slice(0, 10);
    if (!d.title || !yt) { console.warn(`warning: ${f}: needs a title and a YouTube link`); continue; }
    const v = { id: basename(f).replace(/\.ya?ml$/i, ''), title: String(d.title), yt, type: TYPES.includes(d.type) ? d.type : 'other' };
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) v.date = date;
    if (d.performers) v.by = String(d.performers);
    if (d.event) v.event = String(d.event);
    if (d.description) v.desc = String(d.description).trim();
    videos.push(v);
  }
}
videos.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'videos.json'), JSON.stringify(videos, null, 1));
console.log(`videos: ${videos.length} written to ${out}/videos.json`);
