import "server-only";

import { R2StorageProvider } from "@/lib/storage/providers/r2";
import { SupabaseStorageProvider } from "@/lib/storage/providers/supabase";
import type { PrivateStorageProvider } from "@/lib/storage/storage-types";

let provider: PrivateStorageProvider | undefined;

export function getPrivateStorage() {
  if (!provider) {
    const configured =
      process.env.OBJECT_STORAGE_PROVIDER?.trim().toLowerCase() ||
      process.env.STORAGE_PROVIDER?.trim().toLowerCase();
    provider = configured === "r2"
      ? new R2StorageProvider()
      : new SupabaseStorageProvider();
  }
  return provider;
}

