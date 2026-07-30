import { YouTubeError } from "@/lib/youtube/youtube-errors";

export type YouTubeChannelReference =
  | { type: "id"; value: string }
  | { type: "handle"; value: string };

const CHANNEL_ID_PATTERN = /^UC[A-Za-z0-9_-]{22}$/;
const HANDLE_PATTERN = /^@[A-Za-z0-9._-]{3,30}$/;
const HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);

export function parseYouTubeChannelUrl(input: string): YouTubeChannelReference {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new YouTubeError(
      "invalid_channel",
      "Introduce una URL completa del canal.",
    );
  }
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.port ||
    !HOSTS.has(url.hostname.toLowerCase())
  ) {
    throw new YouTubeError(
      "invalid_channel",
      "La URL debe pertenecer a YouTube.",
    );
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "channel" && CHANNEL_ID_PATTERN.test(parts[1] || "")) {
    return { type: "id", value: parts[1] };
  }
  if (HANDLE_PATTERN.test(parts[0] || "")) {
    return { type: "handle", value: parts[0] };
  }
  throw new YouTubeError(
    "invalid_channel",
    "Usa una URL /channel/UC… o /@handle.",
  );
}
