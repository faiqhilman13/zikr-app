import path from 'node:path';
import sharp from 'sharp';

// The 1200x630 card shown when a Zikr link is shared. Built from the same source
// symbol as the app icons so the share card and the installed app match.
const source = path.resolve('ZikrApp/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png');
const output = path.resolve('public/og-image.png');

const WIDTH = 1200;
const HEIGHT = 630;
const BRAND = '#1e3a8a';
const GOLD = '#d4a017';
const IVORY = '#faf8f5';

const LOGO = 200;
const logo = await sharp(source).resize(LOGO, LOGO, { fit: 'contain' }).png().toBuffer();

const text = Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <text x="${WIDTH / 2}" y="420" text-anchor="middle" font-family="sans-serif" font-size="86" font-weight="700" fill="${BRAND}">Zikr</text>
  <text x="${WIDTH / 2}" y="484" text-anchor="middle" font-family="sans-serif" font-size="34" fill="${BRAND}" opacity="0.72">Tasbih &amp; dhikr counter</text>
  <text x="${WIDTH / 2}" y="548" text-anchor="middle" font-family="sans-serif" font-size="26" fill="${GOLD}">Private  ·  Offline  ·  No account</text>
</svg>`);

await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background: IVORY } })
  .composite([
    { input: logo, left: Math.round((WIDTH - LOGO) / 2), top: 110 },
    { input: text, left: 0, top: 0 }
  ])
  .flatten({ background: IVORY })
  .png({ compressionLevel: 9 })
  .toFile(output);

const { width, height, size } = await sharp(output).metadata();
console.log(`og-image.png ${width}x${height}, ${Math.round((size ?? 0) / 1024)}KB`);
