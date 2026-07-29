import { NextResponse } from "next/server";

import { inspectImage, safeUploadName } from "@/lib/editing/image-metadata";
import { getEditingServerEnv } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";
import { getPrivateStorage } from "@/lib/storage/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EXTENSIONS = new Set(["png", "jpg", "webp"]);

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
        uploadId?: unknown;
        extension?: unknown;
        originalFilename?: unknown;
        purpose?: unknown;
      }
    | null;
  if (
    !body ||
    typeof body.uploadId !== "string" ||
    !UUID_PATTERN.test(body.uploadId) ||
    typeof body.extension !== "string" ||
    !EXTENSIONS.has(body.extension) ||
    typeof body.originalFilename !== "string" ||
    body.originalFilename.length < 1 ||
    body.originalFilename.length > 255 ||
    (body.purpose !== "edit" && body.purpose !== "reference")
  ) {
    return NextResponse.json(
      { code: "invalid_upload", error: "La subida no es válida." },
      { status: 400 },
    );
  }

  const storagePath = `${user.id}/uploads/${body.uploadId}.${body.extension}`;
  const { data: existing } = await supabase
    .from("user_uploads")
    .select("id")
    .eq("id", body.uploadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (body.purpose === "reference") {
      return NextResponse.json({ uploadId: existing.id });
    }
    const { data: session } = await supabase
      .from("edit_sessions")
      .select("id, current_version_id")
      .eq("source_upload_id", existing.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (session?.current_version_id) {
      return NextResponse.json({
        uploadId: existing.id,
        sessionId: session.id,
        versionId: session.current_version_id,
      });
    }
  }

  const storage = getPrivateStorage();
  const buffer = await storage.get(storagePath).catch(() => null);
  if (!buffer) {
    return NextResponse.json(
      { code: "storage_error", error: "No encontramos la imagen subida." },
      { status: 404 },
    );
  }

  let metadata: ReturnType<typeof inspectImage>;
  try {
    metadata = inspectImage(buffer);
  } catch {
    await storage.remove(storagePath).catch(() => undefined);
    return NextResponse.json(
      { code: "unsupported_image", error: "El archivo no es una imagen válida." },
      { status: 415 },
    );
  }

  const extensionMatches =
    metadata.extension === body.extension ||
    (metadata.mimeType === "image/jpeg" && body.extension === "jpg");
  if (
    !extensionMatches ||
    buffer.length > config.maxReferenceImageBytes ||
    metadata.width > config.maxReferenceWidth ||
    metadata.height > config.maxReferenceHeight ||
    metadata.width * metadata.height > config.maxReferencePixels
  ) {
    await storage.remove(storagePath).catch(() => undefined);
    return NextResponse.json(
      {
        code: "invalid_upload",
        error: "La imagen no coincide con el formato o supera los límites.",
      },
      { status: 413 },
    );
  }

  const { error: insertError } = await supabase.from("user_uploads").insert({
    id: body.uploadId,
    user_id: user.id,
    storage_path: storagePath,
    original_filename: safeUploadName(body.originalFilename),
    mime_type: metadata.mimeType,
    file_size: buffer.length,
    width: metadata.width,
    height: metadata.height,
    purpose: body.purpose,
    expires_at:
      body.purpose === "reference"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null,
  });
  if (insertError && !insertError.message.includes("duplicate")) {
    await storage.remove(storagePath).catch(() => undefined);
    return NextResponse.json(
      { code: "storage_error", error: "No pudimos registrar la imagen." },
      { status: 500 },
    );
  }

  if (body.purpose === "reference") {
    return NextResponse.json({ uploadId: body.uploadId }, { status: 201 });
  }

  const title =
    safeUploadName(body.originalFilename).replace(/\.[^.]+$/, "") ||
    "Nueva edición";
  const { data: sessionRows, error: sessionError } = await supabase.rpc(
    "create_edit_session_from_upload",
    { p_upload_id: body.uploadId, p_title: title },
  );
  if (sessionError || !sessionRows?.[0]) {
    return NextResponse.json(
      { code: "session_error", error: "No pudimos iniciar la edición." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      uploadId: body.uploadId,
      sessionId: sessionRows[0].created_session_id,
      versionId: sessionRows[0].created_version_id,
    },
    { status: 201 },
  );
}
