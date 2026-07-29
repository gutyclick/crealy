import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { PrivateStorageProvider } from "@/lib/storage/storage-types";

export class SupabaseStorageProvider implements PrivateStorageProvider {
  readonly name = "supabase" as const;
  readonly bucket = process.env.STORAGE_BUCKET?.trim() || "generations";

  async get(path: string) {
    const { data } = await createAdminClient().storage.from(this.bucket).download(path);
    return data ? Buffer.from(await data.arrayBuffer()) : null;
  }
  async head(path: string) {
    const buffer = await this.get(path);
    return buffer ? { size: buffer.length, contentType: null } : null;
  }
  async put(path: string, body: Buffer, contentType: string) {
    const { error } = await createAdminClient().storage.from(this.bucket).upload(path, body, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });
    if (error && !error.message.toLowerCase().includes("exist")) throw error;
  }
  async remove(path: string) {
    const { error } = await createAdminClient().storage.from(this.bucket).remove([path]);
    if (error) throw error;
  }
  async signDownload(path: string, expiresInSeconds: number) {
    const { data } = await createAdminClient().storage.from(this.bucket).createSignedUrl(path, expiresInSeconds);
    return data?.signedUrl ?? null;
  }
  async signUpload(path: string) {
    const { data, error } = await createAdminClient().storage.from(this.bucket).createSignedUploadUrl(path, { upsert: false });
    if (error || !data?.token) throw error || new Error("missing_upload_token");
    return { provider: this.name, path, token: data.token };
  }
}

