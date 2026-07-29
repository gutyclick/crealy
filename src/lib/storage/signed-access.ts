import "server-only";

import { getPrivateStorage } from "@/lib/storage/storage-provider";

export function signPrivateDownload(path: string, expiresInSeconds = 300) {
  return getPrivateStorage().signDownload(path, expiresInSeconds);
}

