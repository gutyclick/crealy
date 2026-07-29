import { NextResponse } from "next/server";

import { getEditingServerEnv } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MIME_EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { code: "unauthorized", error: "Inicia sesión para subir imágenes." },
      { status: 401 },
    );
  }

  let config: ReturnType<typeof getEditingServerEnv>;
  try {
    config = getEditingServerEnv();
  } catch {
    return NextResponse.json(
      { code: "upload_disabled", error: "La subida no está disponible." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        fileName?: unknown;
        mimeType?: unknown;
        fileSize?: unknown;
        purpose?: unknown;
      }
    | null;
  if (
    !body ||
    typeof body.fileName !== "string" ||
    body.fileName.length < 1 ||
    body.fileName.length > 255 ||
    typeof body.mimeType !== "string" ||
    !(body.mimeType in MIME_EXTENSIONS) ||
    typeof body.fileSize !== "number" ||
    !Number.isSafeInteger(body.fileSize) ||
    body.fileSize < 1 ||
    body.fileSize > config.maxReferenceImageBytes ||
    (body.purpose !== "edit" && body.purpose !== "reference")
  ) {
    return NextResponse.json(
      {
        code: "invalid_upload",
        error: "Selecciona una imagen PNG, JPEG o WebP dentro del límite.",
      },
      { status: 400 },
    );
  }

  const uploadId = crypto.randomUUID();
  const extension =
    MIME_EXTENSIONS[body.mimeType as keyof typeof MIME_EXTENSIONS];
  const path = `${user.id}/uploads/${uploadId}.${extension}`;
  const { data, error } = await supabase.storage
    .from("generations")
    .createSignedUploadUrl(path, { upsert: false });

  if (error || !data?.token) {
    return NextResponse.json(
      { code: "storage_error", error: "No pudimos preparar la subida." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    uploadId,
    path,
    token: data.token,
    extension,
  });
}

