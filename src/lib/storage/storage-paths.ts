import "server-only";

export function generationAssetPath(input: {
  userId: string;
  projectId: string;
  generationId: string;
  preview?: boolean;
}) {
  return `${input.userId}/${input.projectId}/${input.preview ? "previews/" : ""}${input.generationId}.${input.preview ? "webp" : "png"}`;
}

export function uploadAssetPath(input: {
  userId: string;
  uploadId: string;
  extension: string;
}) {
  return `${input.userId}/uploads/unattached/${input.uploadId}.${input.extension}`;
}

