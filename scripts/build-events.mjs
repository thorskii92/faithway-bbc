// Builds the site's events from content/events/*.yml (the files the /admin editor saves).
// Writes <out>/events.json and resized photos to <out>/img/events/<id>/ (01.jpg + 01-sm.jpg ..., invitation.jpg).
// Usage: node scripts/build-events.mjs [outDir=docs]
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import YAML from 'yaml';
import sharp from 'sharp';

const out = process.argv[2] || 'docs';
const SRC = 'content/events';
const FONTS = ['elegant', 'classic', 'inscription', 'script', 'modern'];
const CATEGORIES = ['cantata', 'anniversary', 'camp', 'family', 'saturation', 'extension-class', 'building', 'other'];

// image paths saved by the editor look like "/content/uploads/x.jpg" (repo-root relative)
const local = (p) => String(p).replace(/^\/+/, '');

async function resize(src, dst, size, quality) {
  await sharp(src, { failOn: 'none' }).rotate().resize(size, size, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, progressive: true, mozjpeg: true }).toFile(dst);
}

const events = [];
const problems = [];
rmSync(join(out, 'img', 'events'), { recursive: true, force: true });

for (const file of readdirSync(SRC).filter((f) => /\.ya?ml$/i.test(f)).sort()) {
  const id = basename(file).replace(/\.ya?ml$/i, '');
  let d;
  try { d = YAML.parse(readFileSync(join(SRC, file), 'utf8')) || {}; } catch (e) { problems.push(`${file}: not valid YAML (${e.message})`); continue; }
  if (d.draft) continue;
  const date = d.date instanceof Date ? d.date.toISOString().slice(0, 10) : String(d.date || '').slice(0, 10);
  if (!d.title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { problems.push(`${file}: needs a title and a date`); continue; }

  const ev = {
    id, title: String(d.title), cat: CATEGORIES.includes(d.category) ? d.category : 'other', date,
    place: d.place || 'Faithway Bible Baptist Church, Puerto Princesa City',
    sum: String(d.summary || '').trim(),
  };
  if (d.date_label) ev.dateLabel = String(d.date_label);
  if (d.time) ev.time = String(d.time);
  if (d.details) ev.details = String(d.details).trim();
  if (d.sample) ev.sample = true;
  if (FONTS.includes(d.title_font) && d.title_font !== 'elegant') ev.font = d.title_font;

  const dir = join(out, 'img', 'events', id);
  const photos = (Array.isArray(d.photos) ? d.photos : []).map((p) => (typeof p === 'object' && p ? p.image : p)).filter(Boolean);
  let n = 0;
  for (const p of photos) {
    if (!existsSync(local(p))) { problems.push(`${file}: photo not found: ${p}`); continue; }
    mkdirSync(dir, { recursive: true });
    n += 1;
    const nn = String(n).padStart(2, '0');
    await resize(local(p), join(dir, `${nn}.jpg`), 1600, 80);
    await resize(local(p), join(dir, `${nn}-sm.jpg`), 720, 78);
  }
  if (n) { ev.photos = `img/events/${id}`; ev.count = n; }

  if (d.invitation) {
    if (existsSync(local(d.invitation))) {
      mkdirSync(dir, { recursive: true });
      await resize(local(d.invitation), join(dir, 'invitation.jpg'), 1400, 84);
      ev.invitation = `img/events/${id}/invitation.jpg`;
    } else problems.push(`${file}: invitation not found: ${d.invitation}`);
  }
  events.push(ev);
}

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'events.json'), JSON.stringify(events, null, 1));
console.log(`events: ${events.length} written to ${out}/events.json`);
for (const p of problems) console.warn('warning:', p);
