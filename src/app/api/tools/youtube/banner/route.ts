import { NextResponse } from "next/server";

import { logger } from "@/lib/observability/logger";
import { enforceRateLimit, getToolRateLimits } from "@/lib/operations/rate-limit";
import { getChannelBanner } from "@/lib/youtube/client";
import { parseYouTubeChannelUrl } from "@/lib/youtube/parse-youtube-channel-url";
import { YouTubeError } from "@/lib/youtube/youtube-errors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const limited = await enforceRateLimit({
      request,
      action: "tools.youtube.banner.resolve",
      ipPolicy: getToolRateLimits().youtubeIp,
    });
    if (!limited.allowed) {
      return NextResponse.json(
        { error: "Demasiadas consultas. Espera un momento." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "No pudimos validar la solicitud." },
      { status: 503 },
    );
  }

  const url = new URL(request.url).searchParams.get("url") || "";
  try {
    const result = await getChannelBanner(parseYouTubeChannelUrl(url));
    logger.info("tool.youtube_banner_resolved", {
      tool: "youtube-banner-downloader",
      resourceId: result.channelId,
    });
    return NextResponse.json({
      channelId: result.channelId,
      channelTitle: result.channelTitle,
      downloadUrl: `/api/tools/youtube/banner/download?source=${encodeURIComponent(
        result.bannerUrl,
      )}&channel=${encodeURIComponent(result.channelId)}`,
    });
  } catch (reason) {
    if (reason instanceof YouTubeError) {
      const status =
        reason.code === "not_configured"
          ? 503
          : reason.code === "not_found"
            ? 404
            : reason.code === "provider_unavailable"
              ? 502
              : 400;
      return NextResponse.json({ error: reason.message }, { status });
    }
    return NextResponse.json(
      { error: "No pudimos consultar ese canal." },
      { status: 502 },
    );
  }
}
