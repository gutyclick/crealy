import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";

import { inspectImage } from "@/lib/editing/image-metadata";
import type { getEditingServerEnv } from "@/lib/env/server";
import type { Database } from "@/types/database";
import type { GenerationReferenceImage } from "@/types/generation";
import { getPrivateStorage } from "@/lib/storage/provider";

export async function loadGenerationReferences(
  supabase: SupabaseClient<Database>,
  userId: string,
  uploadIds: string[],
  limits: ReturnType<typeof getEditingServerEnv>,
): Promise<GenerationReferenceImage[]> {
  if (!uploadIds.length) return [];

  const { data: uploads, error } = await supabase
    .from("user_uploads")
    .select("id, storage_path, original_filename, mime_type, file_size, width, height")
    .eq("user_id", userId)
    .in("id", uploadIds);
  if (error || !uploads || uploads.length !== uploadIds.length) {
    throw new Error("reference_not_found");
  }

  const byId = new Map(uploads.map((upload) => [upload.id, upload]));
  return Promise.all(
    uploadIds.map(async (uploadId, index) => {
      const upload = byId.get(uploadId);
      if (!upload) throw new Error("reference_not_found");

      const buffer = await getPrivateStorage().get(upload.storage_path);
      if (!buffer) throw new Error("reference_download_failed");
      const metadata = inspectImage(buffer);
      if (
        buffer.length !== upload.file_size ||
        buffer.length > limits.maxReferenceImageBytes ||
        metadata.mimeType !== upload.mime_type ||
        metadata.width !== upload.width ||
        metadata.height !== upload.height ||
        metadata.width > limits.maxReferenceWidth ||
        metadata.height > limits.maxReferenceHeight ||
        metadata.width * metadata.height > limits.maxReferencePixels
      ) {
        throw new Error("invalid_reference");
      }

      let normalized: Buffer;
      try {
        normalized = await sharp(buffer, { failOn: "error" })
          .rotate()
          .toColorspace("srgb")
          .ensureAlpha()
          .png({ compressionLevel: 9 })
          .toBuffer();
      } catch {
        throw new Error("invalid_reference");
      }
      if (
        !normalized.length ||
        normalized.length > limits.maxReferenceImageBytes * 4
      ) {
        throw new Error("invalid_reference");
      }

      return {
        buffer: normalized,
        mimeType: "image/png" as const,
        filename: `reference-${index + 1}.png`,
      };
    }),
  );
}
