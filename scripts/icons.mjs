// Makes the browser-tab and "Add to home screen" icons from the original logo: the white mark
// (dove, cross, Bible and road, cut from img/logo-full-white.png) on the church blue. Writes prototype/img/icons/.
// Usage: node scripts/icons.mjs
import sharp from 'sharp';

const mark = await sharp('prototype/img/logo-full-white.png').extract({ left: 215, top: 8, width: 930, height: 800 }).toBuffer();
async function icon(size, pad, file) {
  const inner = Math.round(size * (1 - 2 * pad));
  const m = await sharp(mark).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#086288' } })
    .composite([{ input: m, gravity: 'center' }]).png().toFile(`prototype/img/icons/${file}`);
}
await icon(512, 0.2, 'icon-512.png');      // maskable: phones may crop it to a circle, so the mark keeps clear of the edges
await icon(192, 0.2, 'icon-192.png');
await icon(180, 0.14, 'apple-touch-icon.png');
await icon(48, 0.08, 'favicon-48.png');
console.log('icons written to prototype/img/icons/');
