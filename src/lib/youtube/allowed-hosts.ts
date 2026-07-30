import { YouTubeError } from "@/lib/youtube/youtube-errors";

const thumbnailHosts = new Set(["i.ytimg.com", "img.youtube.com"]);
const bannerHosts = new Set([
  "yt3.googleusercontent.com",
  "yt3.ggpht.com",
  "i.ytimg.com",
  "lh3.googleusercontent.com",
]);

export function validateYouTubeAssetUrl(
  input: string,
  kind: "thumbnail" | "banner",
) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new YouTubeError("unsafe_source", "La fuente de imagen no es válida.");
  }
  const hosts = kind === "thumbnail" ? thumbnailHosts : bannerHosts;
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !hosts.has(url.hostname.toLowerCase())
  ) {
    throw new YouTubeError(
      "unsafe_source",
      "La fuente de imagen no está permitida.",
    );
  }
  return url;
}
