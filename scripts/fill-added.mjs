// Fills in the "added" field (Philippine time, YYYY-MM-DD HH:mm) for any event, video or verse that
// doesn't have one, using the time the file was first committed to GitHub.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const pad = (n) => String(n).padStart(2, '0');
let filled = 0;
for (const dir of ['content/events', 'content/videos', 'content/verses', 'content/notices', 'content/letters', 'content/testimonies']) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.yml'))) {
    const p = `${dir}/${f}`;
    const s = readFileSync(p, 'utf8');
    if (/^added:\s*\S/m.test(s)) continue;
    const iso = execSync(`git log --diff-filter=A --follow --format=%aI -- "${p}"`, { encoding: 'utf8' }).trim().split('\n')[0];   // newest add (a file can be deleted and re-added)
    const d = iso ? new Date(iso) : new Date();
    const m = new Date(d.getTime() + 8 * 3600e3);   // Manila, UTC+8
    const v = `${m.getUTCFullYear()}-${pad(m.getUTCMonth() + 1)}-${pad(m.getUTCDate())} ${pad(m.getUTCHours())}:${pad(m.getUTCMinutes())}`;
    writeFileSync(p, s.replace(/^added:.*\n?/m, '').replace(/\n*$/, '\n') + `added: ${v}\n`);
    filled += 1;
  }
}
if (filled) console.log(`added date filled in for ${filled} entr${filled === 1 ? 'y' : 'ies'}`);
