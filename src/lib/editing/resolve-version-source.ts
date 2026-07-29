import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type VersionSource = Pick<
  Database["public"]["Tables"]["edit_versions"]["Row"],
  | "storage_path"
  | "source_generation_id"
  | "source_upload_id"
  | "mime_type"
  | "width"
  | "height"
>;

export async function resolveVersionSource(
  supabase: SupabaseClient<Database>,
  version: VersionSource,
) {
  if (version.storage_path) {
    return {
      storagePath: version.storage_path,
      mimeType: version.mime_type,
      width: version.width,
      height: version.height,
    };
  }

  if (version.source_generation_id) {
    const { data } = await supabase
      .from("generations")
      .select("storage_path, mime_type, width, height")
      .eq("id", version.source_generation_id)
      .maybeSingle();
    return data
      ? {
          storagePath: data.storage_path,
          mimeType: data.mime_type,
          width: data.width,
          height: data.height,
        }
      : null;
  }

  if (version.source_upload_id) {
    const { data } = await supabase
      .from("user_uploads")
      .select("storage_path, mime_type, width, height")
      .eq("id", version.source_upload_id)
      .maybeSingle();
    return data
      ? {
          storagePath: data.storage_path,
          mimeType: data.mime_type,
          width: data.width,
          height: data.height,
        }
      : null;
  }

  return null;
}
