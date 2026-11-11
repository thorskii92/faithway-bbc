// Writes the missionary dropdown for prayer letters into docs/admin/config.yml (between the
// "BEGIN missionary options" and "END missionary options" lines). Only missionaries on the public board
// (prototype/missionaries.js) are listed, so hidden missionaries never appear in the editor either.
// Run by: npm run data
import { readFileSync, writeFileSync } from 'node:fs';

const js = readFileSync(process.argv[2] || 'prototype/missionaries.js', 'utf8');
const list = JSON.parse(/MISSIONARIES=(\[[\s\S]*\]);/.exec(js)[1]);
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lines = list
  .slice().sort((a, b) => a.country.localeCompare(b.country) || a.family.localeCompare(b.family))
  .map((m) => `          - { label: ${q(`${m.country} · ${m.name !== m.family ? m.name : m.family} (No. ${m.card})`)}, value: ${m.card} }`);
const cfg = 'docs/admin/config.yml';
const s = readFileSync(cfg, 'utf8').replace(/\r\n/g, '\n');
const re = /( *# BEGIN missionary options[^\n]*\n)[\s\S]*?( *# END missionary options)/;
if (!re.test(s)) throw new Error('missionary options markers not found in ' + cfg);
writeFileSync(cfg, s.replace(re, (_, a, b) => `${a}${lines.join('\n')}\n${b}`));
console.log(`letter options: ${list.length} missionaries written to ${cfg}`);
