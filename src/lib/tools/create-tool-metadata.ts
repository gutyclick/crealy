import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo/create-metadata";

export function createToolMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const dedicatedImages = new Set([
    "/tools/youtube-thumbnail-downloader",
    "/tools/thumbnail-analyzer",
    "/tools/youtube-banner-preview",
  ]);
  return createMetadata({
    title,
    description,
    path,
    image: dedicatedImages.has(path)
      ? `${path}/opengraph-image`
      : "/tools/opengraph-image",
  });
}
