import "server-only";

import { resolveVersionSource } from "@/lib/editing/resolve-version-source";
import { createClient } from "@/lib/supabase/server";
import type {
  EditMessageView,
  EditSessionView,
  EditVersionView,
  RecentEditSession,
} from "@/types/editing";
import { getPrivateStorage } from "@/lib/storage/provider";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function getEditSession(userId: string, sessionId: string) {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("edit_sessions")
    .select("id, title, status, current_version_id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!session?.current_version_id) return null;

  const [{ data: rows }, { data: messageRows }] = await Promise.all([
    supabase
      .from("edit_versions")
      .select(
        "id, parent_version_id, status, storage_path, source_generation_id, source_upload_id, mime_type, width, height, instruction, preserve_composition, created_at",
      )
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .neq("status", "failed")
      .order("created_at", { ascending: true })
      .limit(20),
    supabase
      .from("edit_messages")
      .select("id, version_id, role, content, created_at")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(20),
  ]);

  const completed = (rows ?? []).filter((row) => row.status === "completed");
  const versions: EditVersionView[] = await Promise.all(
    completed.map(async (row) => {
      const source = await resolveVersionSource(supabase, row);
      let imageUrl: string | null = null;
      if (source?.storagePath) {
        imageUrl = await getPrivateStorage().signDownload(
          source.storagePath,
          SIGNED_URL_TTL_SECONDS,
        );
      }
      return {
        id: row.id,
        parentVersionId: row.parent_version_id,
        status: row.status,
        imageUrl,
        width: row.width,
        height: row.height,
        instruction: row.instruction,
        preserveComposition: row.preserve_composition,
        createdAt: row.created_at,
        isCurrent: row.id === session.current_version_id,
      };
    }),
  );

  return {
    id: session.id,
    title: session.title,
    status: session.status,
    currentVersionId: session.current_version_id,
    versions,
    messages: (messageRows ?? []).map(
      (message): EditMessageView => ({
        id: message.id,
        versionId: message.version_id,
        role: message.role as EditMessageView["role"],
        content: message.content,
        createdAt: message.created_at,
      }),
    ),
  } satisfies EditSessionView;
}

export async function listRecentEditSessions(
  userId: string,
  limit = 8,
  status: "active" | "archived" = "active",
): Promise<RecentEditSession[]> {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("edit_sessions")
    .select("id, title, updated_at, current_version_id")
    .eq("user_id", userId)
    .eq("status", status)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return Promise.all(
    (sessions ?? []).map(async (session) => {
      const [{ count }, { data: latest }, { data: current }] = await Promise.all([
        supabase
          .from("edit_versions")
          .select("id", { count: "exact", head: true })
          .eq("session_id", session.id)
          .eq("status", "completed"),
        supabase
          .from("edit_versions")
          .select("instruction")
          .eq("session_id", session.id)
          .eq("status", "completed")
          .not("instruction", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("edit_versions")
          .select(
            "storage_path, source_generation_id, source_upload_id, mime_type, width, height",
          )
          .eq("id", session.current_version_id ?? "")
          .maybeSingle(),
      ]);

      let imageUrl: string | null = null;
      if (current) {
        const source = await resolveVersionSource(supabase, current);
        if (source?.storagePath) {
          imageUrl = await getPrivateStorage().signDownload(
            source.storagePath,
            SIGNED_URL_TTL_SECONDS,
          );
        }
      }

      return {
        id: session.id,
        title: session.title,
        updatedAt: session.updated_at,
        versionCount: count ?? 0,
        latestInstruction: latest?.instruction ?? null,
        imageUrl,
      };
    }),
  );
}
