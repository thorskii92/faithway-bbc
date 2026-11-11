// Builds the site's events from content/events/*.yml (the files the /admin editor saves).
// Writes <out>/events.json and resized photos to <out>/img/events/<id>/ (01.jpg + 01-sm.jpg ..., invitation.jpg).
// Also writes, for each event, a share page <out>/e/<id>.html (so Facebook/Messenger previews show the
// event's poster or cover photo), a calendar file <out>/e/<id>.ics ("Add to calendar") and a QR code
// <out>/e/<id>-qr.svg for printed invitations.
// Usage: node scripts/build-events.mjs [outDir=docs]
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import YAML from 'yaml';
import sharp from 'sharp';
import QRCode from 'qrcode';
import { SITE, CHURCH, ogTags, escAttr } from './site.mjs';

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

/* ---------- calendar: times are Philippine time (UTC+8, no daylight saving) ---------- */
function parseTime(t) {
  const m = /^\s*(\d{1,2})(?::(\d{2}))?\s*([ap])?/i.exec(String(t || ''));
  if (!m) return null;
  let h = +m[1]; const min = +(m[2] || 0), ap = (m[3] || '').toLowerCase();
  if (ap === 'p' && h < 12) h += 12;
  if (ap === 'a' && h === 12) h = 0;
  return h < 24 && min < 60 ? [h, min] : null;
}
const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');   // 20251108T093000Z
function calTimes(ev) {
  const t = ev.dateLabel ? null : parseTime(ev.time);
  if (!t) {   // all-day
    const next = new Date(ev.date + 'T00:00:00Z'); next.setUTCDate(next.getUTCDate() + 1);
    return { allDay: true, start: ev.date.replace(/-/g, ''), end: next.toISOString().slice(0, 10).replace(/-/g, '') };
  }
  const start = new Date(Date.UTC(+ev.date.slice(0, 4), +ev.date.slice(5, 7) - 1, +ev.date.slice(8, 10), t[0] - 8, t[1]));
  return { allDay: false, start: stamp(start), end: stamp(new Date(start.getTime() + 2 * 3600e3)) };   // assume 2 hours
}
const icsText = (s) => String(s).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n');
const fold = (line) => line.match(/.{1,70}/gu).join('\r\n ');
function ics(ev, url) {
  const c = calTimes(ev);
  const when = (k, v) => (c.allDay ? `${k};VALUE=DATE:${v}` : `${k}:${v}`);
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Faithway Bible Baptist Church//Website//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${ev.id}@faithway-bbc`, `DTSTAMP:${ev.date.replace(/-/g, '')}T000000Z`, when('DTSTART', c.start), when('DTEND', c.end),
    `SUMMARY:${icsText(ev.title)}`, `LOCATION:${icsText(ev.place)}`, `DESCRIPTION:${icsText(`${ev.sum}\n\n${url}`)}`, `URL:${url}`,
    'END:VEVENT', 'END:VCALENDAR'].map(fold).join('\r\n') + '\r\n';
}
function googleCal(ev, url) {
  const c = calTimes(ev);
  const q = new URLSearchParams({ action: 'TEMPLATE', text: ev.title, dates: `${c.start}/${c.end}`, location: ev.place, details: `${ev.sum}\n\n${url}` });
  if (!c.allDay) q.set('ctz', 'Asia/Manila');
  return 'https://calendar.google.com/calendar/render?' + q;
}

/* ---------- share pages: Facebook reads these tags, then visitors are sent on to the event ---------- */
const longDate = (ev) => ev.dateLabel || new Intl.DateTimeFormat('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(ev.date + 'T00:00:00Z'));
rmSync(join(out, 'e'), { recursive: true, force: true });
mkdirSync(join(out, 'e'), { recursive: true });
for (const ev of events) {
  const page = `${SITE}e/${ev.id}.html`;
  const image = ev.invitation || (ev.photos ? `${ev.photos}/01.jpg` : 'img/og.jpg');
  const desc = [longDate(ev) + (ev.time ? ' · ' + ev.time : ''), ev.place].join(' · ') + (ev.sum ? '. ' + ev.sum : '');
  writeFileSync(join(out, 'e', `${ev.id}.html`), `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escAttr(ev.title)} · ${CHURCH}</title>
${ogTags({ title: ev.title, description: desc, image, url: page, type: 'article' })}
<meta http-equiv="refresh" content="0; url=../#e-${ev.id}">
<script>location.replace('../#e-${ev.id}')</script>
</head><body style="font-family:system-ui,sans-serif;padding:24px">
<p><a href="../#e-${ev.id}">${escAttr(ev.title)}</a> · ${CHURCH}</p>
</body></html>
`);
  writeFileSync(join(out, 'e', `${ev.id}.ics`), ics(ev, page));
  // QR code for printed invitations and tarpaulins: scanning it opens the event page
  writeFileSync(join(out, 'e', `${ev.id}-qr.svg`), await QRCode.toString(page, { type: 'svg', margin: 2, errorCorrectionLevel: 'M', color: { dark: '#05445F', light: '#FFFFFF' } }));
  ev.gcal = googleCal(ev, page);
}

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'events.json'), JSON.stringify(events, null, 1));
console.log(`events: ${events.length} written to ${out}/events.json`);
for (const p of problems) console.warn('warning:', p);
