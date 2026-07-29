import OpenAI from "openai";
import { NextResponse } from "next/server";

import { buildEditInstruction } from "@/lib/editing/build-edit-instruction";
import { editImage } from "@/lib/editing/edit-image";
import { inspectImage } from "@/lib/editing/image-metadata";
import { resolveVersionSource } from "@/lib/editing/resolve-version-source";
import { getEditingServerEnv } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";
import type {
  ApiErrorResponse,
  EditVersionResponse,
  EditVersionView,
} from "@/types/editing";

export const runtime = "nodejs";
export const maxDuration = 180;

const MAX_REQUEST_BYTES = 12_000;
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function error(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    { code, error: message },
    { status },
  );
}

function reservationError(message: string) {
  if (message.includes("edit_active")) {
    return error("edit_active", "Ya tienes un cambio en proceso.", 429);
  }
  if (message.includes("edit_limit")) {
    return error("edit_limit", "Alcanzaste el límite diario de ediciones.", 429);
  }
  if (message.includes("edit_cooldown")) {
    return error("edit_cooldown", "Espera unos segundos antes de editar otra vez.", 429);
  }
  if (message.includes("version_limit")) {
    return error(
      "version_limit",
      "Esta sesión alcanzó su límite de versiones. Inicia una nueva edición.",
      429,
    );
  }
  if (message.includes("session_not_found")) {
    return error("not_found", "No encontramos esta sesión activa.", 404);
  }
  return error("internal_error", "No pudimos preparar la nueva versión.", 500);
}

function providerError(providerError: unknown) {
  if (providerError instanceof OpenAI.APIError) {
    if (providerError.status === 401 || providerError.status === 403) {
      return {
        code: "provider_auth",
        status: 503,
        message: "La edición con IA no está disponible en este momento.",
      };
    }
    if (providerError.status === 429) {
      return {
        code: "provider_busy",
        status: 429,
        message: "La IA está ocupada. Inténtalo de nuevo en un momento.",
      };
    }
    if (providerError.status && providerError.status >= 500) {
      return {
        code: "provider_busy",
        status: 503,
        message: "La IA no respondió. Tu imagen original sigue intacta.",
      };
    }
  }
  return {
    code: "edit_failed",
    status: 500,
    message: "No pudimos crear esta versión. Tu imagen original sigue intacta.",
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const startedAt = Date.now();
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return error("invalid_request", "Envía la solicitud como JSON.", 415);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("unauthorized", "Inicia sesión para editar.", 401);

  let config: ReturnType<typeof getEditingServerEnv>;
  try {
    config = getEditingServerEnv();
  } catch {
    return error("editing_disabled", "La edición no está disponible.", 503);
  }
  if (!config.editingEnabled) {
    return error("editing_disabled", "La edición está en mantenimiento.", 503);
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return error("invalid_request", "La solicitud es demasiado grande.", 413);
  }

  let body: {
    clientRequestId?: unknown;
    baseVersionId?: unknown;
    instruction?: unknown;
    preserveUnmentionedElements?: unknown;
  };
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > MAX_REQUEST_BYTES) {
      return error("invalid_request", "La solicitud es demasiado grande.", 413);
    }
    body = JSON.parse(text);
  } catch {
    return error("invalid_request", "La solicitud no contiene JSON válido.", 400);
  }

  const instruction =
    typeof body.instruction === "string" ? body.instruction.trim() : "";
  if (
    typeof body.clientRequestId !== "string" ||
    !UUID_PATTERN.test(body.clientRequestId) ||
    (body.baseVersionId != null &&
      (typeof body.baseVersionId !== "string" ||
        !UUID_PATTERN.test(body.baseVersionId))) ||
    instruction.length < 10 ||
    instruction.length > 1000 ||
    typeof body.preserveUnmentionedElements !== "boolean"
  ) {
    return error(
      "invalid_request",
      "Describe el cambio en entre 10 y 1000 caracteres.",
      400,
    );
  }

  const { sessionId } = await params;
  if (!UUID_PATTERN.test(sessionId)) {
    return error("not_found", "No encontramos esta sesión.", 404);
  }

  const { data: session } = await supabase
    .from("edit_sessions")
    .select("id, current_version_id, previous_response_id, status")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!session || session.status !== "active") {
    return error("not_found", "No encontramos esta sesión activa.", 404);
  }

  const provisionalInstruction = buildEditInstruction({
    instruction,
    preserveComposition: body.preserveUnmentionedElements,
    width: 1,
    height: 1,
  });
  const { data: reservationRows, error: reserveError } = await supabase.rpc(
    "reserve_edit_version",
    {
      p_session_id: sessionId,
      p_client_request_id: body.clientRequestId,
      p_base_version_id: (body.baseVersionId as string | null) ?? null,
      p_instruction: instruction,
      p_enhanced_instruction: provisionalInstruction,
      p_preserve_composition: body.preserveUnmentionedElements,
      p_daily_limit: config.dailyLimit,
      p_cooldown_seconds: config.cooldownSeconds,
      p_version_limit: config.sessionVersionLimit,
    },
  );
  if (reserveError || !reservationRows?.[0]) {
    return reservationError(reserveError?.message ?? "");
  }

  const reservation = reservationRows[0];
  const versionId = reservation.reserved_version_id;

  if (reservation.is_existing) {
    if (reservation.version_status !== "completed") {
      return error(
        "edit_in_progress",
        reservation.version_status === "failed"
          ? "La solicitud anterior no se completó. Prueba de nuevo."
          : "Esta versión todavía está en proceso.",
        409,
      );
    }

    const { data: existing } = await supabase
      .from("edit_versions")
      .select("id, parent_version_id, status, storage_path, width, height, instruction, preserve_composition, created_at")
      .eq("id", versionId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing?.storage_path) {
      const { data: signed } = await supabase.storage
        .from("generations")
        .createSignedUrl(existing.storage_path, SIGNED_URL_TTL_SECONDS);
      if (signed?.signedUrl) {
        const version: EditVersionView = {
          id: existing.id,
          parentVersionId: existing.parent_version_id,
          status: existing.status,
          imageUrl: signed.signedUrl,
          width: existing.width,
          height: existing.height,
          instruction: existing.instruction,
          preserveComposition: existing.preserve_composition,
          createdAt: existing.created_at,
          isCurrent: true,
        };
        return NextResponse.json<EditVersionResponse>({
          version,
          assistantMessage: {
            id: `assistant-${existing.id}`,
            versionId: existing.id,
            role: "assistant",
            content: "Listo. Creé una nueva versión con los cambios solicitados.",
            createdAt: existing.created_at,
          },
        });
      }
    }
    return error("storage_error", "La versión existe, pero no pudimos mostrarla.", 500);
  }

  let storagePath: string | null = null;
  try {
    const { data: baseVersion } = await supabase
      .from("edit_versions")
      .select("storage_path, source_generation_id, source_upload_id, mime_type, width, height")
      .eq("id", reservation.selected_base_version_id)
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .eq("status", "completed")
      .maybeSingle();
    if (!baseVersion) throw new Error("base_version_missing");

    const source = await resolveVersionSource(supabase, baseVersion);
    if (
      !source?.storagePath ||
      !source.mimeType ||
      !source.width ||
      !source.height
    ) {
      throw new Error("base_source_missing");
    }

    const enhancedInstruction = buildEditInstruction({
      instruction,
      preserveComposition: body.preserveUnmentionedElements,
      width: source.width,
      height: source.height,
    });
    const { error: processingError } = await supabase
      .from("edit_versions")
      .update({
        status: "processing",
        enhanced_instruction: enhancedInstruction,
        model: config.responsesModel,
      })
      .eq("id", versionId)
      .eq("user_id", user.id)
      .eq("status", "pending");
    if (processingError) throw processingError;

    const { data: sourceBlob, error: downloadError } = await supabase.storage
      .from("generations")
      .download(source.storagePath);
    if (downloadError || !sourceBlob) throw new Error("source_download_failed");

    const sourceBuffer = Buffer.from(await sourceBlob.arrayBuffer());
    if (sourceBuffer.length > config.maxReferenceImageBytes) {
      throw new Error("source_too_large");
    }
    const sourceMetadata = inspectImage(sourceBuffer);
    if (
      sourceMetadata.mimeType !== source.mimeType ||
      sourceMetadata.width > config.maxReferenceWidth ||
      sourceMetadata.height > config.maxReferenceHeight ||
      sourceMetadata.width * sourceMetadata.height > config.maxReferencePixels
    ) {
      throw new Error("invalid_source_image");
    }

    const generated = await editImage({
      imageBuffer: sourceBuffer,
      mimeType: sourceMetadata.mimeType,
      instruction: enhancedInstruction,
      previousResponseId:
        reservation.selected_base_version_id === session.current_version_id
          ? session.previous_response_id
          : null,
      width: sourceMetadata.width,
      height: sourceMetadata.height,
    });
    const output = inspectImage(generated.buffer);
    storagePath = `${user.id}/edits/${sessionId}/${versionId}.png`;
    const { error: uploadError } = await supabase.storage
      .from("generations")
      .upload(storagePath, generated.buffer, {
        contentType: output.mimeType,
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data: signed, error: signedError } = await supabase.storage
      .from("generations")
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
    if (signedError || !signed?.signedUrl) {
      await supabase.storage.from("generations").remove([storagePath]);
      storagePath = null;
      throw new Error("signed_url_failed");
    }

    const { error: completeError } = await supabase.rpc(
      "complete_edit_version",
      {
        p_version_id: versionId,
        p_storage_path: storagePath,
        p_mime_type: output.mimeType,
        p_width: output.width,
        p_height: output.height,
        p_model: generated.model,
        p_provider_response_id: generated.providerResponseId,
      },
    );
    if (completeError) {
      await supabase.storage.from("generations").remove([storagePath]);
      storagePath = null;
      throw completeError;
    }

    const createdAt = new Date().toISOString();
    console.info("[Crealy Edit]", {
      sessionId,
      versionId,
      status: "completed",
      durationMs: Date.now() - startedAt,
      model: config.responsesModel,
      sourceBytes: sourceBuffer.length,
      outputBytes: generated.buffer.length,
    });
    return NextResponse.json<EditVersionResponse>(
      {
        version: {
          id: versionId,
          parentVersionId: reservation.selected_base_version_id,
          status: "completed",
          imageUrl: signed.signedUrl,
          width: output.width,
          height: output.height,
          instruction,
          preserveComposition: body.preserveUnmentionedElements,
          createdAt,
          isCurrent: true,
        },
        assistantMessage: {
          id: `assistant-${versionId}`,
          versionId,
          role: "assistant",
          content: "Listo. Creé una nueva versión con los cambios solicitados.",
          createdAt,
        },
      },
      { status: 201 },
    );
  } catch (caught) {
    if (storagePath) {
      await supabase.storage.from("generations").remove([storagePath]);
    }
    const mapped = providerError(caught);
    await supabase.rpc("fail_edit_version", {
      p_version_id: versionId,
      p_error_code: mapped.code,
    });
    console.error("[Crealy Edit]", {
      sessionId,
      versionId,
      errorCode: mapped.code,
      durationMs: Date.now() - startedAt,
      model: config.responsesModel,
    });
    return error(mapped.code, mapped.message, mapped.status);
  }
}
