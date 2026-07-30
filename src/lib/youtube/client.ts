import "server-only";

import { validateYouTubeAssetUrl } from "@/lib/youtube/allowed-hosts";
import type { YouTubeChannelReference } from "@/lib/youtube/parse-youtube-channel-url";
import { YouTubeError } from "@/lib/youtube/youtube-errors";

type ChannelApiResponse = {
  items?: Array<{
    id?: string;
    snippet?: { title?: string };
    brandingSettings?: {
      image?: {
        bannerExternalUrl?: string;
        bannerImageUrl?: string;
      };
    };
  }>;
  error?: { code?: number; message?: string };
};

export async function getChannelBanner(reference: YouTubeChannelReference) {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY?.trim();
  if (!apiKey) {
    throw new YouTubeError(
      "not_configured",
      "La consulta de banners aún no está configurada.",
    );
  }
  const params = new URLSearchParams({
    part: "brandingSettings,snippet",
    key: apiKey,
    ...(reference.type === "id"
      ? { id: reference.value }
      : { forHandle: reference.value }),
  });
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${params}`,
    {
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 300 },
    },
  );
  if (!response.ok) {
    throw new YouTubeError(
      "provider_unavailable",
      response.status === 403
        ? "La API de YouTube rechazó la consulta."
        : "YouTube no está disponible en este momento.",
    );
  }
  const data = (await response.json()) as ChannelApiResponse;
  const channel = data.items?.[0];
  if (!channel) {
    throw new YouTubeError("not_found", "No encontramos ese canal.");
  }
  const bannerUrl =
    channel.brandingSettings?.image?.bannerExternalUrl ||
    channel.brandingSettings?.image?.bannerImageUrl;
  if (!bannerUrl) {
    throw new YouTubeError(
      "not_found",
      "El canal no publica un banner mediante la API oficial.",
    );
  }
  validateYouTubeAssetUrl(bannerUrl, "banner");
  return {
    channelId: channel.id || reference.value,
    channelTitle: channel.snippet?.title || "Canal de YouTube",
    bannerUrl,
  };
}
