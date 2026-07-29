import "server-only";

import sharp from "sharp";

export async function createPreview(buffer: Buffer, width = 640) {
  return sharp(buffer)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 78, effort: 5 })
    .toBuffer();
}

