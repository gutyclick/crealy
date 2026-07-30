import { NextResponse } from "next/server";

import { inspectImage } from "@/lib/image-processing/inspect-image";
import { enforceRateLimit, getToolRateLimits } from "@/lib/operations/rate-limit";
import { fetchYouTubeImage } from "@/lib/youtube/fetch-youtube-image";
import { YouTubeError } from "@/lib/youtube/youtube-errors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const limited = await enforceRateLimit({
      request,
      action: "tools.youtube.banner.download",
      ipPolicy: getToolRateLimits().youtubeIp,
    });
    if (!limited.allowed) {
      return NextResponse.json(
        { error: "Demasiadas descargas. Espera un momento." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "No pudimos validar la solicitud." },
      { status: 503 },
    );
  }
  const params = new URL(request.url).searchParams;
  const source = params.get("source") || "";
  const channel = (params.get("channel") || "channel").replace(
    /[^A-Za-z0-9_-]/g,
    "",
  );
  try {
    const image = await fetchYouTubeImage(source, "banner");
    const metadata = await inspectImage(image.buffer);
    const extension =
      image.mimeType === "image/png"
        ? "png"
        : image.mimeType === "image/webp"
          ? "webp"
          : "jpg";
    return new NextResponse(new Uint8Array(image.buffer), {
      headers: {
        "Content-Type": image.mimeType,
        "Content-Length": String(image.buffer.byteLength),
        "Content-Disposition": `attachment; filename="youtube-banner-${channel}.${extension}"`,
        "Cache-Control": "private, no-store",
        "X-Image-Width": String(metadata.width),
        "X-Image-Height": String(metadata.height),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (reason) {
    return NextResponse.json(
      {
        error:
          reason instanceof YouTubeError
            ? reason.message
            : "No pudimos descargar el banner.",
      },
      { status: reason instanceof YouTubeError ? 400 : 502 },
    );
  }
}
