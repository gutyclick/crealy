"use client";

import { createClient } from "@/lib/supabase/client";
import { readApiResponse } from "@/lib/uploads/read-api-response";

export type UploadPurpose = "edit" | "reference";

type SignedUpload = {
  uploadId: string;
  assetId: string;
  path: string;
  extension: string;
} & (
  | { provider: "supabase"; token: string }
  | {
      provider: "r2";
      uploadUrl: string;
      headers: Record<string, string>;
    }
);

type FinalizedUpload = {
  uploadId: string;
  sessionId?: string;
  versionId?: string;
};

export async function uploadPrivateImage(
  file: File,
  purpose: UploadPurpose,
) {
  const signResponse = await fetch("/api/uploads/images/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      purpose,
    }),
  });
  const signed = await readApiResponse<
    SignedUpload & { error?: string }
  >(signResponse, "No pudimos preparar la subida.");

  if (!signResponse.ok || signed.error) {
    throw new Error(signed.error || "No pudimos preparar la subida.");
  }

  if (signed.provider === "r2") {
    const uploadResponse = await fetch(signed.uploadUrl, {
      method: "PUT",
      headers: signed.headers,
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error(
        "La conexión se interrumpió durante la subida. Inténtalo otra vez.",
      );
    }
  } else {
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("generations")
      .uploadToSignedUrl(signed.path, signed.token, file, {
        contentType: file.type,
        cacheControl: "3600",
      });
    if (uploadError) {
      throw new Error(
        uploadError.message.includes("maximum allowed size")
          ? "La imagen supera el límite permitido."
          : "La conexión se interrumpió durante la subida. Inténtalo otra vez.",
      );
    }
  }

  const finalizeResponse = await fetch("/api/uploads/images/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uploadId: signed.uploadId,
      assetId: signed.assetId,
      extension: signed.extension,
      originalFilename: file.name,
      purpose,
    }),
  });
  const finalized = await readApiResponse<
    FinalizedUpload & { error?: string }
  >(finalizeResponse, "No pudimos validar la imagen subida.");

  if (!finalizeResponse.ok || finalized.error) {
    throw new Error(finalized.error || "No pudimos validar la imagen subida.");
  }
  return finalized;
}
