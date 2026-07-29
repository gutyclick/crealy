import "server-only";

import sharp from "sharp";

import { ImageProcessingError } from "@/lib/image-processing/image-processing-errors";

export async function inspectImage(buffer: Buffer) {
  if (!buffer.length) throw new ImageProcessingError("empty_image", "La imagen está vacía.");
  const metadata = await sharp(buffer, { failOn: "error" }).metadata();
  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new ImageProcessingError("unsupported_image", "El formato de imagen no es compatible.");
  }
  const mimeType =
    metadata.format === "png"
      ? "image/png"
      : metadata.format === "jpeg"
        ? "image/jpeg"
        : metadata.format === "webp"
          ? "image/webp"
          : null;
  if (!mimeType) throw new ImageProcessingError("unsupported_image", "El formato de imagen no es compatible.");
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    mimeType,
  };
}

