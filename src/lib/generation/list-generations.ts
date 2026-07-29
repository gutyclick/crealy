import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  ContentType,
  GenerationFormat,
  GenerationListItem,
  GenerationStatus,
} from "@/types/generation";
import { getPrivateStorage } from "@/lib/storage/provider";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

type GenerationRow = {
  id: string;
  project_id: string;
  content_type: string;
  requested_format: string;
  status: string;
  storage_path: string | null;
  created_at: string;
  projects: { title: string } | null;
};

export async function listGenerations(
  userId: string,
  limit = 12,
): Promise<GenerationListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generations")
    .select(
      "id, project_id, content_type, requested_format, status, storage_path, created_at, projects(title)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Crealy Generations · list]", { code: error.code });
    return [];
  }

  return Promise.all(
    ((data ?? []) as unknown as GenerationRow[]).map(async (item) => {
      let imageUrl: string | null = null;

      if (item.status === "completed" && item.storage_path) {
        imageUrl = await getPrivateStorage().signDownload(
          item.storage_path,
          SIGNED_URL_TTL_SECONDS,
        );
      }

      return {
        id: item.id,
        projectId: item.project_id,
        projectTitle: item.projects?.title ?? "Creación sin título",
        contentType: item.content_type as ContentType,
        format: item.requested_format as GenerationFormat,
        status: item.status as GenerationStatus,
        imageUrl,
        createdAt: item.created_at,
      };
    }),
  );
}
