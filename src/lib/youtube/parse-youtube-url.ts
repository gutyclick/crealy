import { YouTubeError } from "@/lib/youtube/youtube-errors";

export const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

export function validateYouTubeVideoId(value: string) {
  if (!YOUTUBE_VIDEO_ID_PATTERN.test(value)) {
    throw new YouTubeError("invalid_video_id", "El ID del video no es válido.");
  }
  return value;
}

export function parseYouTubeUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new YouTubeError("invalid_url", "Introduce una URL completa de YouTube.");
  }
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.port ||
    !YOUTUBE_HOSTS.has(url.hostname.toLowerCase())
  ) {
    throw new YouTubeError("invalid_url", "La URL debe pertenecer a YouTube.");
  }

  const host = url.hostname.toLowerCase();
  if (host === "youtu.be") {
    return validateYouTubeVideoId(url.pathname.split("/").filter(Boolean)[0] || "");
  }
  if (url.pathname === "/watch") {
    return validateYouTubeVideoId(url.searchParams.get("v") || "");
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "shorts" || parts[0] === "embed") {
    return validateYouTubeVideoId(parts[1] || "");
  }
  throw new YouTubeError(
    "invalid_url",
    "Usa una URL de video, Shorts o video incrustado.",
  );
}
