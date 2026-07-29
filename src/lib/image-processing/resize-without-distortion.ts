import "server-only";

import sharp from "sharp";

import type { ExportStrategy } from "@/config/content-formats";

export async function resizeWithoutDistortion(input: {
  buffer: Buffer;
  width: number;
  height: number;
  strategy: ExportStrategy;
}) {
  if (input.strategy === "none") return input.buffer;
  if (input.strategy === "contain") {
    return sharp(input.buffer)
      .resize(input.width, input.height, {
        fit: "contain",
        background: { r: 14, g: 15, b: 12, alpha: 1 },
        withoutEnlargement: false,
      })
      .png({ compressionLevel: 9 })
      .toBuffer();
  }
  if (input.strategy === "extend-background") {
    const background = await sharp(input.buffer)
      .resize(input.width, input.height, { fit: "cover" })
      .blur(28)
      .toBuffer();
    const foreground = await sharp(input.buffer)
      .resize(input.width, input.height, { fit: "contain" })
      .png()
      .toBuffer();
    return sharp(background).composite([{ input: foreground }]).png({ compressionLevel: 9 }).toBuffer();
  }
  return sharp(input.buffer)
    .resize(input.width, input.height, { fit: "cover", position: "attention" })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

