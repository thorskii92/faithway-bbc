// Reads a public Google Drive folder (shared "Anyone with the link") without an API key, using Drive's
// public embedded folder view, so event photo albums can stay in Drive instead of on the website.
// Subfolders become album sections (e.g. "Friday Evening"); a subfolder named "videos" is folded into
// its parent section as a "watch the videos in Drive" link.
import https from 'node:https';

export const folderId = (url) => (/\/folders\/([\w-]{10,})/.exec(String(url || '')) || /[?&]id=([\w-]{10,})/.exec(String(url || '')) || [])[1] || null;
export const folderUrl = (id) => `https://drive.google.com/drive/folders/${id}`;
export const thumbUrl = (id, w) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;

const PHOTO = /\.(jpe?g|png|heic|heif|webp|gif)$/i;
const VIDEO = /\.(mov|mp4|m4v|avi|3gp|mkv|webm)$/i;

function get(url, hops = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept-Language': 'en' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && hops < 5) { res.resume(); return resolve(get(res.headers.location, hops + 1)); }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`Drive answered ${res.statusCode}`)); }
      let body = ''; res.setEncoding('utf8'); res.on('data', (c) => (body += c)); res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

async function entries(id) {
  const html = await get(`https://drive.google.com/embeddedfolderview?id=${id}`);
  const list = [];
  list.title = ((/<title>([^<]*)/.exec(html) || [])[1] || '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();   // the folder's own name
  for (const m of html.matchAll(/<a href="([^"]+)"[^>]*>[\s\S]*?flip-entry-title">([^<]*)/g)) {
    const url = m[1].replace(/&amp;/g, '&');
    const name = m[2].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
    const folder = /\/folders\/([\w-]+)/.exec(url), file = /\/file\/d\/([\w-]+)/.exec(url);
    if (folder) list.push({ type: 'folder', id: folder[1], name });
    else if (file) list.push({ type: 'file', id: file[1], name });
  }
  return list;
}

const title = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s*\/\s*/g, ' · ');
// rough chronological order for names like "Friday Evening" or "Saturday Morning"; otherwise Drive's order
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
function when(name, firstDay) {
  const n = name.toLowerCase(), d = DAYS.findIndex((x) => n.includes(x));
  if (d < 0) return null;
  const part = /morning/.test(n) ? 0 : /afternoon|noon/.test(n) ? 1 : /evening|night/.test(n) ? 2 : 1;
  return ((d - firstDay + 7) % 7) * 3 + part;
}

// Videos stay private to the church: "Videos" subfolders are skipped and video files are not counted or linked.
const SKIP_VIDEOS = true;

// every Drive folder link in the field (one per line, or a list)
export const folderIds = (value) => [...new Set((Array.isArray(value) ? value : [value]).flatMap((v) => String(v || '').split(/[\s,]+/)).map(folderId).filter(Boolean))];

// One link: its subfolders become the sections (photos loose in it are "Photos").
// Several links (e.g. only some services of a weekend): each linked folder becomes a section under its own name.
// → { url, photos: total, sections: [{ name, photos: [fileId...] }] }
export async function readAlbum(value) {
  const roots = folderIds(value);
  if (!roots.length) throw new Error('no Google Drive folder link found');
  const root = roots[0];
  const sections = [];
  async function walk(id, name, parent, leaf = '', isRoot = false) {
    if (SKIP_VIDEOS && /^videos?$/i.test(leaf.trim())) return;   // "Videos" subfolders are for the church's own use
    const list = await entries(id);
    if (isRoot && roots.length > 1) name = list.title || name;
    const isVideoFolder = /^videos?$/i.test(leaf.trim()) && parent;
    const sec = isVideoFolder ? parent : { name, folder: id, photos: [], videos: 0, videosUrl: null };
    for (const e of list) {
      if (e.type === 'file' && PHOTO.test(e.name)) sec.photos.push(e.id);
      else if (!SKIP_VIDEOS && e.type === 'file' && VIDEO.test(e.name)) { sec.videos += 1; sec.videosUrl = sec.videosUrl || folderUrl(id); }
    }
    if (!isVideoFolder) sections.push(sec);
    for (const e of list) if (e.type === 'folder') await walk(e.id, isVideoFolder ? name : (name ? `${name} / ${e.name}` : e.name), sec, e.name);
  }
  for (const r of roots) await walk(r, '', null, '', true);
  const kept = sections.filter((s) => s.photos.length)
    .map((s) => ({ name: s.name ? title(s.name) : 'Photos', photos: s.photos }));
  // order day-named sections in time; the week "starts" on whichever day keeps them closest together (Fri–Sun, not Sun–Fri)
  const days = [...new Set(kept.map((s) => DAYS.findIndex((x) => s.name.toLowerCase().includes(x))).filter((d) => d >= 0))];
  if (days.length > 1) {
    const span = (start) => Math.max(...days.map((d) => (d - start + 7) % 7));
    const first = days.reduce((best, d) => (span(d) < span(best) ? d : best), days[0]);
    const key = (s) => when(s.name, first) ?? 99;   // sections without a day go last
    kept.sort((a, b) => key(a) - key(b));
  }
  return {
    url: folderUrl(root),
    photos: kept.reduce((n, s) => n + s.photos.length, 0),
    sections: kept,
  };
}
