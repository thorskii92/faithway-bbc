// Builds <out>/verses.json from content/verses/*.yml (memory verses saved in the /admin editor).
// Usage: node scripts/build-verses.mjs [outDir=docs]
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const out = process.argv[2] || 'docs';
const SRC = 'content/verses';
const verses = [];
if (existsSync(SRC)) {
  for (const f of readdirSync(SRC).filter((n) => /\.ya?ml$/i.test(n))) {
    let d;
    try { d = YAML.parse(readFileSync(join(SRC, f), 'utf8')) || {}; } catch (e) { console.warn(`warning: ${f}: not valid YAML`); continue; }
    if (d.draft) continue;
    const week = d.week_of instanceof Date ? d.week_of.toISOString().slice(0, 10) : String(d.week_of || '').slice(0, 10);
    if (!d.reference || !d.text || !/^\d{4}-\d{2}-\d{2}$/.test(week)) { console.warn(`warning: ${f}: needs a reference, the verse text and a week`); continue; }
    const v = { ref: String(d.reference).trim(), text: String(d.text).trim(), week };
    if (d.note) v.note = String(d.note).trim();
    if (d.sample) v.sample = true;
    verses.push(v);
  }
}
verses.sort((a, b) => a.week.localeCompare(b.week));
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'verses.json'), JSON.stringify(verses, null, 1));
console.log(`verses: ${verses.length} written to ${out}/verses.json`);
