// Makes the picture Facebook/Messenger show when someone shares the website (1200×630):
// the church photo with the white logo over a deep-blue fade. Writes prototype/img/og.jpg.
// Usage: npm run og-image
import sharp from 'sharp';

const W = 1200, H = 630;
const photo = await sharp('prototype/img/church-front.jpg').resize(W, H, { fit: 'cover', position: 'attention' }).toBuffer();
const fade = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#05445F" stop-opacity=".96"/><stop offset=".46" stop-color="#086288" stop-opacity=".9"/><stop offset=".8" stop-color="#086288" stop-opacity=".2"/><stop offset="1" stop-color="#086288" stop-opacity="0"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/></svg>`);
const logo = await sharp('prototype/img/logo-full-white.png').resize({ height: 520 }).toBuffer();
const { width: lw } = await sharp(logo).metadata();
await sharp(photo).composite([{ input: fade }, { input: logo, left: Math.round(250 - lw / 2), top: 55 }])
  .jpeg({ quality: 84, mozjpeg: true }).toFile('prototype/img/og.jpg');
console.log('wrote prototype/img/og.jpg');
