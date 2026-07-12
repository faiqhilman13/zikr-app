import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

describe('brand assets', () => {
  it('does not carry the source image right-edge artifact into the web logo', async () => {
    const image = sharp(path.resolve('public/brand-symbol.png'));
    const metadata = await image.metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    const { data } = await image.extract({ left: width - 1, top: 0, width: 1, height }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const opaquePixels = Array.from({ length: height }, (_, index) => data[index * 4 + 3]).filter((alpha) => alpha === 255).length;
    expect(opaquePixels).toBeLessThan(height);
  });
});
