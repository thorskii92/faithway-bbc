import { geoNaturalEarth1, geoPath, geoCentroid } from 'd3-geo';
import { feature } from 'topojson-client';
import { readFileSync, writeFileSync } from 'node:fs';
const topo = JSON.parse(readFileSync('node_modules/world-atlas/countries-110m.json', 'utf8'));
const fc = feature(topo, topo.objects.countries);
fc.features = fc.features.filter(f => f.properties.name !== 'Antarctica');
const W = 1000, H = 520;
const proj = geoNaturalEarth1().rotate([-146, 0]).fitExtent([[6, 6], [W - 6, H - 6]], fc);
const path = geoPath(proj).digits(1);
const out = fc.features.map(f => {
  const [x, y] = proj(geoCentroid(f));
  return { n: f.properties.name, d: path(f), c: [+x.toFixed(1), +y.toFixed(1)] };
});
// precise points for a few sample placements
const pts = { palawan: proj([118.74, 9.74]).map(v => +v.toFixed(1)) };
const s = `const WORLD=${JSON.stringify({ w: W, h: H, countries: out, pts })};`;
writeFileSync(process.argv[2] || 'map.js', s);
console.log(s.length, out.length, out.filter(o=>/Philipp|Papua|Kenya|Brazil|Fiji|Solomon|Nepal|Mongol|Madag|Peru|Ukraine/.test(o.n)).map(o=>o.n+':'+o.c).join(' | '));
