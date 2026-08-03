import "server-only";

import { R2StorageProvider } from "@/lib/storage/providers/r2";
import { SupabaseStorageProvider } from "@/lib/storage/providers/supabase";
import type { PrivateStorageProvider } from "@/lib/storage/storage-types";
import { recordStorageError } from "@/lib/observability/operations-monitor";

let provider: PrivateStorageProvider | undefined;

function observedStorage(inner: PrivateStorageProvider): PrivateStorageProvider {
  const observe = async <T>(operation: string, action: () => Promise<T>) => {
    try {
      return await action();
    } catch (error) {
      recordStorageError(operation, error);
      throw error;
    }
  };
  return {
    name: inner.name,
    bucket: inner.bucket,
    get: (path) => observe("get", () => inner.get(path)),
    head: (path) => observe("head", () => inner.head(path)),
    put: (path, body, contentType) => observe("put", () => inner.put(path, body, contentType)),
    remove: (path) => observe("remove", () => inner.remove(path)),
    signDownload: (path, expires) => observe("sign_download", () => inner.signDownload(path, expires)),
    signUpload: (path, contentType, expires) => observe("sign_upload", () => inner.signUpload(path, contentType, expires)),
  };
}

export function getPrivateStorage() {
  if (!provider) {
    const configured =
      process.env.OBJECT_STORAGE_PROVIDER?.trim().toLowerCase() ||
      process.env.STORAGE_PROVIDER?.trim().toLowerCase();
    const selected = configured === "r2"
      ? new R2StorageProvider()
      : new SupabaseStorageProvider();
    provider = observedStorage(selected);
  }
  return provider;
}
