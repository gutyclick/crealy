import { NextResponse } from "next/server";

import { getEditingServerEnv } from "@/lib/env/server";
import {
  enforceRateLimit,
  RATE_LIMITS,
} from "@/lib/operations/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getPrivateStorage } from "@/lib/storage/provider";

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
  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { code: "email_unverified", error: "Confirma tu correo antes de subir imágenes." },
      { status: 403 },
    );
  }

  try {
    const rateLimit = await enforceRateLimit({
      request,
      userId: user.id,
      action: "upload.sign",
      userPolicy: RATE_LIMITS.uploadUser,
      ipPolicy: RATE_LIMITS.uploadIp,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { code: "rate_limited", error: "Demasiadas subidas. Espera un momento." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
      );
    }
  } catch {
    return NextResponse.json(
      { code: "operations_unavailable", error: "No pudimos validar la subida." },
      { status: 503 },
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

  const [{ count }, { data: uploads }] = await Promise.all([
    supabase
      .from("user_uploads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("user_uploads")
      .select("file_size")
      .eq("user_id", user.id)
      .limit(500),
  ]);
  const totalBytes = (uploads ?? []).reduce(
    (sum, upload) => sum + upload.file_size,
    0,
  );
  const maxFiles = Number(process.env.UPLOAD_MAX_FILES_PER_USER || 100);
  const maxBytes =
    Number(process.env.UPLOAD_MAX_TOTAL_MB_PER_USER || 500) * 1024 * 1024;
  if ((count ?? 0) >= maxFiles || totalBytes + body.fileSize > maxBytes) {
    return NextResponse.json(
      {
        code: "upload_quota_exceeded",
        error: "Alcanzaste tu cuota de archivos. Elimina referencias que ya no uses.",
      },
      { status: 413 },
    );
  }

  const uploadId = crypto.randomUUID();
  const extension =
    MIME_EXTENSIONS[body.mimeType as keyof typeof MIME_EXTENSIONS];
  const path = `${user.id}/uploads/${uploadId}.${extension}`;
  try {
    const intent = await getPrivateStorage().signUpload(
      path,
      body.mimeType,
      10 * 60,
    );
    return NextResponse.json({
      uploadId,
      ...intent,
      extension,
    });
  } catch {
    return NextResponse.json(
      { code: "storage_error", error: "No pudimos preparar la subida." },
      { status: 500 },
    );
  }
}
