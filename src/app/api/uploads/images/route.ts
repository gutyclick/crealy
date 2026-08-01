import { NextResponse } from "next/server";

import { getEditingServerEnv } from "@/lib/env/server";
import { inspectImage, safeUploadName } from "@/lib/editing/image-metadata";
import { createClient } from "@/lib/supabase/server";
import { getPrivateStorage } from "@/lib/storage/provider";
import { getUploadedFileRetentionDays } from "@/lib/storage/retention-policy";

export const runtime = "nodejs";
export const maxDuration = 60;

const FORM_OVERHEAD_BYTES = 512_000;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { code: "unauthorized", error: "Inicia sesión para subir una imagen." },
      { status: 401 },
    );
  }

  let config: ReturnType<typeof getEditingServerEnv>;
  try {
    config = getEditingServerEnv();
  } catch {
    return NextResponse.json(
      { code: "editing_disabled", error: "La edición no está disponible." },
      { status: 503 },
    );
  }

  if (!config.editingEnabled) {
    return NextResponse.json(
      { code: "editing_disabled", error: "La edición está en mantenimiento." },
      { status: 503 },
    );
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (
    declaredLength >
    config.maxReferenceImageBytes + FORM_OVERHEAD_BYTES
  ) {
    return NextResponse.json(
      { code: "file_too_large", error: "La imagen supera el límite permitido." },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { code: "invalid_upload", error: "No pudimos leer el archivo." },
      { status: 400 },
    );
  }

  const images = formData.getAll("image");
  if (images.length !== 1 || !(images[0] instanceof File)) {
    return NextResponse.json(
      { code: "invalid_upload", error: "Selecciona una sola imagen." },
      { status: 400 },
    );
  }

  const file = images[0];
  if (file.size < 1 || file.size > config.maxReferenceImageBytes) {
    return NextResponse.json(
      { code: "file_too_large", error: "La imagen supera el límite permitido." },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let metadata: ReturnType<typeof inspectImage>;
  try {
    metadata = inspectImage(buffer);
  } catch {
    return NextResponse.json(
      {
        code: "unsupported_image",
        error: "Usa una imagen PNG, JPEG o WebP válida.",
      },
      { status: 415 },
    );
  }

  if (
    file.type &&
    file.type !== metadata.mimeType &&
    !(file.type === "image/jpg" && metadata.mimeType === "image/jpeg")
  ) {
    return NextResponse.json(
      {
        code: "mime_mismatch",
        error: "El contenido del archivo no coincide con su formato.",
      },
      { status: 415 },
    );
  }

  const filenameExtension = file.name.split(".").pop()?.toLowerCase();
  const allowedExtensions =
    metadata.mimeType === "image/jpeg"
      ? ["jpg", "jpeg"]
      : [metadata.extension];
  if (
    !filenameExtension ||
    !allowedExtensions.includes(filenameExtension)
  ) {
    return NextResponse.json(
      {
        code: "extension_mismatch",
        error: "La extensión del archivo no coincide con su contenido.",
      },
      { status: 415 },
    );
  }

  if (
    metadata.width > config.maxReferenceWidth ||
    metadata.height > config.maxReferenceHeight ||
    metadata.width * metadata.height > config.maxReferencePixels
  ) {
    return NextResponse.json(
      {
        code: "image_dimensions",
        error: "La imagen tiene dimensiones demasiado grandes.",
      },
      { status: 413 },
    );
  }

  const uploadId = crypto.randomUUID();
  const storagePath = `${user.id}/uploads/${uploadId}.${metadata.extension}`;
  const storage = getPrivateStorage();
  try {
    await storage.put(storagePath, buffer, metadata.mimeType);
  } catch {
    return NextResponse.json(
      { code: "storage_error", error: "No pudimos guardar la imagen." },
      { status: 500 },
    );
  }

  const title = safeUploadName(file.name).replace(/\.[^.]+$/, "") || "Nueva edición";
  const { data: upload, error: uploadError } = await supabase
    .from("user_uploads")
    .insert({
      id: uploadId,
      user_id: user.id,
      storage_path: storagePath,
      original_filename: safeUploadName(file.name),
      mime_type: metadata.mimeType,
      file_size: file.size,
      width: metadata.width,
      height: metadata.height,
      purpose: "edit",
      expires_at: new Date(
        Date.now() + getUploadedFileRetentionDays() * 86_400_000,
      ).toISOString(),
    })
    .select("id")
    .single();

  if (uploadError || !upload) {
    await storage.remove(storagePath).catch(() => undefined);
    return NextResponse.json(
      { code: "storage_error", error: "No pudimos registrar la imagen." },
      { status: 500 },
    );
  }

  const { data: sessionRows, error: sessionError } = await supabase.rpc(
    "create_edit_session_from_upload",
    { p_upload_id: upload.id, p_title: title },
  );

  if (sessionError || !sessionRows?.[0]) {
    await storage.remove(storagePath).catch(() => undefined);
    await supabase.from("user_uploads").delete().eq("id", upload.id);
    return NextResponse.json(
      { code: "session_error", error: "No pudimos iniciar la edición." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      uploadId: upload.id,
      sessionId: sessionRows[0].created_session_id,
      versionId: sessionRows[0].created_version_id,
    },
    { status: 201 },
  );
}
