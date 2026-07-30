import { createOgImage, ogContentType, ogSize } from "@/lib/seo/create-og-image";
export const size = ogSize;
export const contentType = ogContentType;
export default function Image() {
  return createOgImage("Analiza la claridad visual de tu miniatura.");
}

