import { NextResponse } from "next/server";

import { inspectImage } from "@/lib/image-processing/inspect-image";
import { logger } from "@/lib/observability/logger";
import { enforceRateLimit, getToolRateLimits } from "@/lib/operations/rate-limit";
import { fetchYouTubeImage } from "@/lib/youtube/fetch-youtube-image";
import {
  getVideoThumbnailUrl,
  isYouTubeThumbnailVariant,
} from "@/lib/youtube/get-video-thumbnails";
import { validateYouTubeVideoId } from "@/lib/youtube/parse-youtube-url";
import { YouTubeError } from "@/lib/youtube/youtube-errors";

export const runtime = "nodejs";

function error(message: string, status: number, retryAfter?: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined,
    },
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ videoId: string; variant: string }> },
) {
  try {
    const limited = await enforceRateLimit({
      request,
      action: "tools.youtube.thumbnail",
      ipPolicy: getToolRateLimits().youtubeIp,
    });
    if (!limited.allowed) {
      return error("Demasiadas descargas. Espera un momento.", 429, limited.retryAfter);
    }
  } catch {
    return error("No pudimos validar la solicitud.", 503);
  }

  const { videoId, variant } = await context.params;
  try {
    validateYouTubeVideoId(videoId);
    if (!isYouTubeThumbnailVariant(variant)) {
      return error("La variante solicitada no existe.", 400);
    }
    const source = getVideoThumbnailUrl(videoId, variant);
    const image = await fetchYouTubeImage(source, "thumbnail");
    const metadata = await inspectImage(image.buffer);
    logger.info("tool.youtube_thumbnail_downloaded", {
      tool: "youtube-thumbnail-downloader",
      variant,
      width: metadata.width,
      height: metadata.height,
    });
    return new NextResponse(new Uint8Array(image.buffer), {
      headers: {
        "Content-Type": image.mimeType,
        "Content-Length": String(image.buffer.byteLength),
        "Content-Disposition": `attachment; filename="youtube-${videoId}-${variant}.jpg"`,
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "X-Image-Width": String(metadata.width),
        "X-Image-Height": String(metadata.height),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (reason) {
    if (reason instanceof YouTubeError) {
      return error(reason.message, reason.code === "not_found" ? 404 : 400);
    }
    return error("No pudimos descargar esta miniatura.", 502);
  }
}
