// Builds the smaller editor collections:
//   content/notices/*.yml       → <out>/notices.json   (the "This week at Faithway" announcements)
//   content/settings/church.yml → <out>/church.json    (phone, email and prayer request form: Visit section and footer)
//   content/ministries/*.yml    → <out>/ministries.json (the Ministries section)
//   content/testimonies/*.yml   → <out>/testimonies.json (Stories of grace; only with the person's consent),
//                                 photos to <out>/img/testimonies/<id>.jpg
//   content/letters/*.yml       → <out>/letters.json   (missionary prayer letters), scanned pages resized to
//                                 <out>/img/letters/<id>/, PDFs copied to <out>/letters/<id>.pdf
// PRIVACY: a letter is only published if its missionary is on the public board (<out>/missionaries.js lists
// visible missionaries only), so a hidden missionary's letter can never reach the website.
// Usage: node scripts/build-extras.mjs [outDir=docs]
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import sharp from 'sharp';

const out = process.argv[2] || 'docs';
const local = (p) => String(p).replace(/^\/+/, '');
const day = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v || '').slice(0, 10));
const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const problems = [];
function readAll(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => /\.ya?ml$/i.test(f)).sort().flatMap((f) => {
    try { return [{ id: f.replace(/\.ya?ml$/i, ''), file: f, d: YAML.parse(readFileSync(join(dir, f), 'utf8')) || {} }]; }
    catch (e) { problems.push(`${dir}/${f}: not valid YAML (${e.message})`); return []; }
  }).filter((x) => !x.d.draft);
}
mkdirSync(out, { recursive: true });

/* ---------- announcements ---------- */
const notices = [];
for (const { file, d } of readAll('content/notices')) {
  const from = day(d.show_from), until = day(d.show_until);
  if (!d.title || !isDay(from) || !isDay(until)) { problems.push(`notices/${file}: needs a title, "show from" and "show until"`); continue; }
  const n = { title: String(d.title).trim(), from, until };
  if (d.text) n.text = String(d.text).trim();
  if (d.link) n.link = String(d.link).trim();
  if (d.link_label) n.linkLabel = String(d.link_label).trim();
  notices.push(n);
}
notices.sort((a, b) => a.from.localeCompare(b.from) || a.title.localeCompare(b.title));
writeFileSync(join(out, 'notices.json'), JSON.stringify(notices, null, 1));

/* ---------- church info ---------- */
let church = {};
if (existsSync('content/settings/church.yml')) {
  const d = YAML.parse(readFileSync('content/settings/church.yml', 'utf8')) || {};
  const KEYS = { phone: 'phone', email: 'email', contact_note: 'note', prayer_form: 'prayerForm' };
  for (const [k, to] of Object.entries(KEYS)) if (d[k]) church[to] = String(d[k]).trim();
  if (church.prayerForm && !/^https:\/\//.test(church.prayerForm)) { problems.push('church.yml: the prayer request form link must start with https://'); delete church.prayerForm; }
}
writeFileSync(join(out, 'church.json'), JSON.stringify(church, null, 1));

/* ---------- ministries (the Ministries section), in the order set in the editor ---------- */
const ministries = [];
for (const { file, d } of readAll('content/ministries')) {
  if (!d.title) { problems.push(`ministries/${file}: needs a name`); continue; }
  const m = { title: String(d.title).trim(), order: Number(d.order) || 99 };
  for (const [k, to] of Object.entries({ schedule: 'when', audience: 'who', contact: 'contact', summary: 'sum', link: 'link', link_label: 'linkLabel' })) {
    if (d[k]) m[to] = String(d[k]).trim();
  }
  ministries.push(m);
}
ministries.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
ministries.forEach((m) => delete m.order);
writeFileSync(join(out, 'ministries.json'), JSON.stringify(ministries, null, 1));

/* ---------- prayer letters ---------- */
const visible = new Set();
const mjs = existsSync(join(out, 'missionaries.js')) ? readFileSync(join(out, 'missionaries.js'), 'utf8') : '';
const mm = /MISSIONARIES=(\[[\s\S]*\]);/.exec(mjs);
if (mm) JSON.parse(mm[1]).forEach((m) => visible.add(m.card));
else problems.push(`${out}/missionaries.js not found: prayer letters skipped`);

rmSync(join(out, 'img', 'letters'), { recursive: true, force: true });
rmSync(join(out, 'letters'), { recursive: true, force: true });
const letters = [];
for (const { id, file, d } of readAll('content/letters')) {
  const card = parseInt(d.missionary, 10), date = day(d.date);
  if (!visible.has(card)) { if (mm) problems.push(`letters/${file}: missionary No. ${d.missionary} is not on the public board, so this letter is not published`); continue; }
  if (!d.title || !isDay(date)) { problems.push(`letters/${file}: needs a title and a date`); continue; }
  const L = { id, card, title: String(d.title).trim(), date };
  if (d.body) L.body = String(d.body).trim();
  const pages = (Array.isArray(d.pages) ? d.pages : []).map((p) => (typeof p === 'object' && p ? p.image : p)).filter(Boolean);
  let n = 0;
  for (const p of pages) {
    if (!existsSync(local(p))) { problems.push(`letters/${file}: page not found: ${p}`); continue; }
    const dir = join(out, 'img', 'letters', id);
    mkdirSync(dir, { recursive: true });
    n += 1;
    await sharp(local(p), { failOn: 'none' }).rotate().resize(1800, 1800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(join(dir, `${String(n).padStart(2, '0')}.jpg`));
  }
  if (n) L.pages = Array.from({ length: n }, (_, i) => `img/letters/${id}/${String(i + 1).padStart(2, '0')}.jpg`);
  if (d.pdf) {
    if (existsSync(local(d.pdf)) && /\.pdf$/i.test(d.pdf)) {
      mkdirSync(join(out, 'letters'), { recursive: true });
      copyFileSync(local(d.pdf), join(out, 'letters', `${id}.pdf`));
      L.pdf = `letters/${id}.pdf`;
    } else problems.push(`letters/${file}: PDF not found: ${d.pdf}`);
  }
  if (!L.body && !L.pages && !L.pdf) { problems.push(`letters/${file}: add the letter text, scanned pages or a PDF`); continue; }
  letters.push(L);
}
letters.sort((a, b) => b.date.localeCompare(a.date));
writeFileSync(join(out, 'letters.json'), JSON.stringify(letters, null, 1));

/* ---------- testimonies: published only when "they agreed to share this" is ticked ---------- */
rmSync(join(out, 'img', 'testimonies'), { recursive: true, force: true });
const testimonies = [];
for (const { id, file, d } of readAll('content/testimonies')) {
  if (!d.consent) { problems.push(`testimonies/${file}: not published until "They agreed to share this" is ticked`); continue; }
  if (!d.name || !d.story) { problems.push(`testimonies/${file}: needs a name and the story`); continue; }
  const t = { id, name: String(d.name).trim(), story: String(d.story).trim(), date: day(d.date) };
  if (d.about) t.about = String(d.about).trim();
  if (d.quote) t.quote = String(d.quote).trim();
  if (d.photo) {
    if (existsSync(local(d.photo))) {
      mkdirSync(join(out, 'img', 'testimonies'), { recursive: true });
      await sharp(local(d.photo), { failOn: 'none' }).rotate().resize(480, 480, { fit: 'cover', position: 'attention' })
        .jpeg({ quality: 80, mozjpeg: true }).toFile(join(out, 'img', 'testimonies', `${id}.jpg`));
      t.photo = `img/testimonies/${id}.jpg`;
    } else problems.push(`testimonies/${file}: photo not found: ${d.photo}`);
  }
  testimonies.push(t);
}
testimonies.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
writeFileSync(join(out, 'testimonies.json'), JSON.stringify(testimonies, null, 1));

console.log(`extras: ${testimonies.length} testimonies, ${ministries.length} ministries, ${notices.length} announcements, ${letters.length} prayer letters, church info ${Object.keys(church).length ? 'set' : 'empty'} → ${out}/`);
for (const p of problems) console.warn('warning:', p);
