// Builds <out>/videos.json from content/videos/*.yml (videos saved in the /admin editor).
// A video is a YouTube link or a public Facebook video link; Facebook ones can have an uploaded thumbnail.
// Usage: node scripts/build-videos.mjs [outDir=docs]
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, basename } from 'node:path';
import YAML from 'yaml';
import sharp from 'sharp';

const out = process.argv[2] || 'docs';
const SRC = 'content/videos';
const TYPES = ['cantata', 'choir', 'special', 'congregational', 'other'];

// accepts youtu.be/ID, youtube.com/watch?v=ID, /shorts/ID, /embed/ID, /live/ID, or a bare 11-character ID
export function youtubeId(url) {
  const s = String(url || '').trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|[?&]v=|\/(?:shorts|embed|live|v)\/)([\w-]{11})/);
  return /youtu/.test(s) || /^[\w-]{11}$/.test(s) ? (m ? m[1] : null) : null;
}

// Facebook: public video / watch / reel links, and fb.watch short links
export function facebookUrl(url) {
  const s = String(url || '').trim();
  if (!/^https?:\/\/((www|m|web)\.)?(facebook\.com|fb\.watch)\//i.test(s)) return null;
  return s.replace(/^https?:\/\/(m|web)\./i, 'https://www.');
}

async function main() {
  rmSync(join(out, 'img', 'videos'), { recursive: true, force: true });
  const videos = [];
  if (existsSync(SRC)) {
    for (const f of readdirSync(SRC).filter((n) => /\.ya?ml$/i.test(n))) {
      let d;
      try { d = YAML.parse(readFileSync(join(SRC, f), 'utf8')) || {}; } catch { console.warn(`warning: ${f}: not valid YAML`); continue; }
      if (d.draft) continue;
      const link = d.link || d.youtube;                 // older entries used the 'youtube' field
      const yt = youtubeId(link), fb = yt ? null : facebookUrl(link);
      if (!d.title || !(yt || fb)) { console.warn(`warning: ${f}: needs a title and a YouTube or Facebook link`); continue; }
      const date = d.date instanceof Date ? d.date.toISOString().slice(0, 10) : String(d.date || '').slice(0, 10);
      const v = { id: basename(f).replace(/\.ya?ml$/i, ''), title: String(d.title), type: TYPES.includes(d.type) ? d.type : 'other' };
      if (yt) v.yt = yt; else v.fb = fb;
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) v.date = date;
      if (d.performers) v.by = String(d.performers);
      if (d.event) v.event = String(d.event);
      if (d.description) v.desc = String(d.description).trim();
      const thumb = d.thumbnail && String(d.thumbnail).replace(/^\/+/, '');
      if (thumb && existsSync(thumb)) {
        mkdirSync(join(out, 'img', 'videos'), { recursive: true });
        await sharp(thumb, { failOn: 'none' }).rotate().resize(960, 540, { fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true })
          .toFile(join(out, 'img', 'videos', `${v.id}.jpg`));
        v.thumb = `img/videos/${v.id}.jpg`;
      } else if (thumb) console.warn(`warning: ${f}: thumbnail not found: ${d.thumbnail}`);
      videos.push(v);
    }
  }
  videos.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'videos.json'), JSON.stringify(videos, null, 1));
  console.log(`videos: ${videos.length} written to ${out}/videos.json`);
}

if (process.argv[1] && process.argv[1].endsWith('build-videos.mjs')) await main();
