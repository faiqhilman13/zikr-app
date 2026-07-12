import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const output = path.resolve('public/icons');
await fs.mkdir(output, { recursive: true });

const sourceIcon = path.resolve('ZikrApp/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png');
const sourceSymbol = path.resolve('ZikrApp/Resources/symbol.png');

// palette + max compression keeps each icon in the tens of kilobytes; every one of
// these files is precached by the service worker on first visit.
const PNG_OPTIONS = { compressionLevel: 9, palette: true, quality: 90 };

async function render(size, filename, padding = 0.2) {
  const inner = Math.round(size * (1 - padding * 2));
  const logo = await sharp(sourceIcon).resize(inner, inner, { fit: 'contain' }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#1e3a8aff' } })
    .composite([{ input: logo, left: Math.round((size-inner)/2), top: Math.round((size-inner)/2) }])
    .flatten({ background: '#1e3a8a' })
    .png(PNG_OPTIONS)
    .toFile(path.join(output, filename));
}

await render(192, 'icon-192.png', 0.03);
await render(512, 'icon-512.png', 0.03);
await render(512, 'icon-maskable-512.png', 0.18);
await render(180, 'apple-touch-icon.png', 0.03);
// The original symbol asset contains one fully opaque stray column on its far-right edge.
// Crop only that artifact before producing the web header asset; preserve the artwork itself.
const symbolMetadata = await sharp(sourceSymbol).metadata();
await sharp(sourceSymbol)
  .extract({ left: 0, top: 0, width: (symbolMetadata.width ?? 1089) - 1, height: symbolMetadata.height ?? 1094 })
  .resize(320, 320, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png(PNG_OPTIONS)
  .toFile(path.resolve('public/brand-symbol.png'));
console.log(`Generated PWA icons in ${output}`);
