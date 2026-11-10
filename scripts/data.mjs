// Builds preview/missionaries.js from MISSION/missionaries.csv using the same projection as map.js.
import { geoNaturalEarth1, geoCentroid } from 'd3-geo';
import { feature } from 'topojson-client';
import { readFileSync, writeFileSync } from 'node:fs';

const [csvPath, outPath] = process.argv.slice(2);

const topo = JSON.parse(readFileSync('node_modules/world-atlas/countries-110m.json', 'utf8'));
const fc = feature(topo, topo.objects.countries);
fc.features = fc.features.filter((f) => f.properties.name !== 'Antarctica');
const W = 1000, H = 520;
const proj = geoNaturalEarth1().rotate([-146, 0]).fitExtent([[6, 6], [W - 6, H - 6]], fc);
const byName = new Map(fc.features.map((f) => [f.properties.name, f]));

function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const MAP_NAME = { 'DR Congo': 'Dem. Rep. Congo', 'East Timor': 'Timor-Leste' };
const REGION = {
  'Asia & Pacific': 'BD TW VN TH ID IN NP KH JP CN LA MM BN TL PG KR KZ PK MN FJ PH AU',
  Africa: 'BW DZ MW ZM ZA CD RW ET GH MZ MG UG LR KE TZ SL ZW',
  Americas: 'AR CA GT MX CR CO CL SV HT BO',
  'Europe & Middle East': 'FR AM NO UA IT IL ES',
};
const regionOf = (iso) => Object.keys(REGION).find((r) => REGION[r].split(' ').includes(iso));
// explicit [lat, lng] where a centroid would mislead (overseas territories) or the card names a town
const COORD_BY_COUNTRY = { FR: [46.6, 2.4], NO: [61.0, 9.5] };
const COORD_BY_PLACE = {
  'Quezon, Palawan': [9.24, 117.99],
  'Bataraza, Palawan': [8.67, 117.62],
  'Danum Danum, Candawaga, Rizal, Palawan': [8.85, 117.55],
  'Balangiga, Eastern Samar': [11.11, 125.39],
  'Catbalogan City, Samar': [11.78, 124.88],
  'Puerto Princesa City, Palawan': [9.74, 118.74],
  Zanzibar: [-6.16, 39.2],
};
const NO_PHOTO = new Set([20, 151]);
// cards the user asked not to flag on the site (2026-11-08): Nguyen Ba Qui (21) and the cards without photos.
// Their notes stay in missionaries.csv for fixing the Canva cards.
// 1-11: only the country facts on the card are wrong, and the site never shows those
// 93-97: the DR Congo flag on the cards confirms the country; 131: Zanzibar is part of Tanzania
const NO_FLAG = new Set([20, 21, 151, 102, 103, 104, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 93, 94, 95, 96, 97, 131]);
const EXCLUDE = new Set([150, 154, 155]); // duplicate design, photo-only cards

const rows = parseCSV(readFileSync(csvPath, 'utf8')).slice(1).filter((r) => r.length > 1);
// PRIVACY: rows whose visibility starts with "hidden" (RAN/CRAN, China, India) never leave this script
const visible = rows.filter((r) => !EXCLUDE.has(+r[0]) && !(r[8] || '').startsWith('hidden'));
const spriteIds = visible.map((r) => +r[0]).filter((n) => !NO_PHOTO.has(n));
// review notes can quote another card's text: scrub any hidden missionary's name or card number from them
const hiddenRows = rows.filter((r) => (r[8] || '').startsWith('hidden'));
const scrub = (s) => hiddenRows.reduce((acc, h) => {
  let out = acc;
  if (h[5] && !h[5].startsWith('(')) out = out.replace(new RegExp(h[5].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'another missionary\'s name');
  return out.replace(new RegExp(`\\bcard ${h[0]}\\b`, 'g'), 'another card');
}, s);

const perCountry = new Map();
const out = [];
for (const [card, country, iso, place, family, missionary, affiliation, issue] of visible) {
  const n = +card;
  const f = byName.get(MAP_NAME[country] || country);
  if (!f) throw new Error('No map shape for ' + country);
  const k = perCountry.get(iso) || 0; perCountry.set(iso, k + 1);
  let pt;
  if (COORD_BY_PLACE[place]) pt = proj([COORD_BY_PLACE[place][1], COORD_BY_PLACE[place][0]]);
  else {
    const ll = COORD_BY_COUNTRY[iso] ? [COORD_BY_COUNTRY[iso][1], COORD_BY_COUNTRY[iso][0]] : geoCentroid(f);
    const [x, y] = proj(ll);
    const a = k * 2.39996, r = k ? 2.4 * Math.sqrt(k) : 0; // golden-angle spread so pins don't stack
    pt = [x + r * Math.cos(a), y + r * Math.sin(a)];
  }
  const known = missionary && missionary !== '(unknown)';
  out.push({
    card: n, country, iso, mapName: f.properties.name, place: place || country,
    family, name: known ? missionary : family, aff: affiliation, issue: NO_FLAG.has(n) ? '' : scrub(issue || ''),
    region: regionOf(iso), pt: pt.map((v) => +v.toFixed(1)),
    sprite: NO_PHOTO.has(n) ? -1 : spriteIds.indexOf(n),
  });
}
writeFileSync(outPath, `const MISSIONARIES=${JSON.stringify(out)};`);
writeFileSync(outPath.replace(/missionaries\.js$/, 'sprite-order.json'), JSON.stringify(spriteIds));
console.log(out.length, 'missionaries,', new Set(out.map((m) => m.iso)).size, 'countries,', out.filter((m) => m.issue).length, 'flagged,', out.filter((m) => !m.region).length, 'without region');
