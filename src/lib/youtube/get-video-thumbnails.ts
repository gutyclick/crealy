import { validateYouTubeVideoId } from "@/lib/youtube/parse-youtube-url";

export const YOUTUBE_THUMBNAIL_VARIANTS = {
  maxres: "maxresdefault.jpg",
  standard: "sddefault.jpg",
  high: "hqdefault.jpg",
  medium: "mqdefault.jpg",
  default: "default.jpg",
} as const;

export type YouTubeThumbnailVariant = keyof typeof YOUTUBE_THUMBNAIL_VARIANTS;

export function isYouTubeThumbnailVariant(
  value: string,
): value is YouTubeThumbnailVariant {
  return value in YOUTUBE_THUMBNAIL_VARIANTS;
}

export function getVideoThumbnailUrl(
  videoId: string,
  variant: YouTubeThumbnailVariant,
) {
  validateYouTubeVideoId(videoId);
  return `https://i.ytimg.com/vi/${videoId}/${YOUTUBE_THUMBNAIL_VARIANTS[variant]}`;
}
