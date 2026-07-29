import "server-only";

import { imageSize } from "image-size";

const MIME_BY_TYPE = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
} as const;

export function inspectImage(buffer: Buffer) {
  const result = imageSize(buffer);
  const mimeType =
    result.type && result.type in MIME_BY_TYPE
      ? MIME_BY_TYPE[result.type as keyof typeof MIME_BY_TYPE]
      : null;

  if (!mimeType || !result.width || !result.height) {
    throw new Error("unsupported_image");
  }

  return {
    mimeType,
    width: result.width,
    height: result.height,
    extension: result.type === "jpg" ? "jpg" : result.type,
  };
}

export function safeUploadName(name: string) {
  const leaf = name.split(/[\\/]/).pop() || "imagen";
  const normalized = leaf
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();
  return (normalized || "imagen").slice(0, 180);
}

