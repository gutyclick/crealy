import "server-only";

import { validateYouTubeAssetUrl } from "@/lib/youtube/allowed-hosts";
import { YouTubeError } from "@/lib/youtube/youtube-errors";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export async function fetchYouTubeImage(
  source: string,
  kind: "thumbnail" | "banner",
) {
  const url = validateYouTubeAssetUrl(source, kind);
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(8_000),
    headers: { Accept: "image/jpeg,image/png,image/webp" },
    cache: "no-store",
  });
  if (response.status >= 300 && response.status < 400) {
    throw new YouTubeError("unsafe_source", "La fuente intentó redirigir.");
  }
  if (!response.ok || !response.body) {
    throw new YouTubeError("not_found", "La imagen no está disponible.");
  }
  const mimeType = response.headers.get("content-type")?.split(";")[0] || "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    throw new YouTubeError(
      "unsupported_media",
      "YouTube no devolvió una imagen compatible.",
    );
  }
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > MAX_IMAGE_BYTES) {
    throw new YouTubeError("file_too_large", "La imagen es demasiado grande.");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new YouTubeError("file_too_large", "La imagen es demasiado grande.");
    }
    chunks.push(value);
  }
  return { buffer: Buffer.concat(chunks), mimeType };
}
