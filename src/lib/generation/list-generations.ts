import "server-only";

import {
  normalizeContentType,
  normalizeGenerationVariant,
} from "@/config/generation-products";
import { getPrivateStorage } from "@/lib/storage/provider";
import { createClient } from "@/lib/supabase/server";
import type { GenerationListItem, GenerationStatus } from "@/types/generation";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

type GenerationRow = {
  id: string;
  project_id: string;
  content_type: string;
  platform: string | null;
  cover_platform: string | null;
  requested_format: string;
  quality: string;
  credit_cost: number | null;
  status: string;
  storage_path: string | null;
  preview_asset_id: string | null;
  created_at: string;
  projects: { title: string } | null;
};

export async function listGenerations(
  userId: string,
  limit = 12,
  options?: { throwOnError?: boolean },
): Promise<GenerationListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generations")
    .select(
      "id, project_id, content_type, platform, cover_platform, requested_format, quality, credit_cost, status, storage_path, preview_asset_id, created_at, projects(title)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Crealy Generations · list]", { code: error.code });
    if (options?.throwOnError) throw new Error("generation_list_unavailable");
    return [];
  }

  const rows = (data ?? []) as unknown as GenerationRow[];
  const previewIds = rows.flatMap((item) =>
    item.preview_asset_id ? [item.preview_asset_id] : [],
  );
  const { data: previews } = previewIds.length
    ? await supabase
        .from("assets")
        .select("id, storage_key, status")
        .in("id", previewIds)
        .eq("status", "active")
    : { data: [] };
  const previewPaths = new Map(
    (previews ?? []).map((asset) => [asset.id, asset.storage_key]),
  );

  const items = await Promise.all(
    rows.map(async (item): Promise<GenerationListItem | null> => {
      const contentType = normalizeContentType(item.content_type);
      const format = normalizeGenerationVariant(item.requested_format);
      if (!contentType || !format) return null;
      let imageUrl: string | null = null;
      if (item.status === "completed" && item.storage_path) {
        const previewPath = item.preview_asset_id
          ? previewPaths.get(item.preview_asset_id)
          : null;
        imageUrl = await getPrivateStorage().signDownload(
          previewPath ?? item.storage_path,
          SIGNED_URL_TTL_SECONDS,
        );
      }
      return {
        id: item.id,
        projectId: item.project_id,
        projectTitle: item.projects?.title ?? "Creación sin título",
        contentType,
        platform: (item.platform ?? item.cover_platform) as GenerationListItem["platform"],
        coverPlatform: item.cover_platform as GenerationListItem["coverPlatform"],
        format,
        quality: item.quality === "high" ? "high" : "standard",
        creditCost: item.credit_cost,
        status: item.status as GenerationStatus,
        imageUrl,
        createdAt: item.created_at,
      };
    }),
  );
  return items.filter((item): item is GenerationListItem => item !== null);
}
