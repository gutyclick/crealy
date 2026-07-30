import { createOgImage, ogContentType, ogSize } from "@/lib/seo/create-og-image";

export const size = ogSize;
export const contentType = ogContentType;
export default function Image() {
  return createOgImage("Convierte una idea en una pieza visual clara.");
}

