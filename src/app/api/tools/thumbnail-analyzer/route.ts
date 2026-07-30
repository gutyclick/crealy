import { NextResponse } from "next/server";

import {
  consumeReservedCredits,
  ensureWelcomeCredits,
  releaseCredits,
  reserveCredits,
} from "@/lib/credits/credit-service";
import { getToolsServerEnv } from "@/lib/env/server";
import { inspectImage } from "@/lib/image-processing/inspect-image";
import { logger } from "@/lib/observability/logger";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/operations/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { analyzeThumbnail } from "@/lib/tools/analyze-thumbnail";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 512_000;
const MAX_PIXELS = 40_000_000;

function jsonError(error: string, status: number, code: string) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(request: Request) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_REQUEST_BYTES) {
    return jsonError("La imagen no puede superar 6 MB.", 413, "file_too_large");
  }
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return jsonError("Envía una imagen válida.", 415, "invalid_request");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError(
      "Inicia sesión para analizar una miniatura.",
      401,
      "unauthorized",
    );
  }

  try {
    const limited = await enforceRateLimit({
      request,
      userId: user.id,
      action: "tools.thumbnail.analysis",
      userPolicy: RATE_LIMITS.thumbnailAnalysisUser,
      ipPolicy: RATE_LIMITS.thumbnailAnalysisIp,
    });
    if (!limited.allowed) {
      return NextResponse.json(
        { error: "Espera un momento antes de realizar otro análisis.", code: "rate_limit" },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
      );
    }
  } catch {
    return jsonError("No pudimos validar la solicitud.", 503, "rate_limit_unavailable");
  }

  let config: ReturnType<typeof getToolsServerEnv>;
  try {
    config = getToolsServerEnv();
  } catch {
    return jsonError("El analizador no está disponible.", 503, "not_configured");
  }
  const apiKey = process.env.OPENAI_API_KEY?.trim() || "";
  if (!config.analysisEnabled || !apiKey) {
    return jsonError("El analizador no está disponible.", 503, "not_configured");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("No pudimos leer el archivo.", 400, "invalid_request");
  }
  const file = form.get("image");
  const clientRequestId = String(form.get("clientRequestId") || "");
  if (!(file instanceof File) || !/^[0-9a-f-]{36}$/i.test(clientRequestId)) {
    return jsonError("La solicitud está incompleta.", 400, "invalid_request");
  }
  if (
    file.size === 0 ||
    file.size > MAX_IMAGE_BYTES ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  ) {
    return jsonError(
      "Usa una imagen JPG, PNG o WebP de hasta 6 MB.",
      400,
      "invalid_image",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let metadata: Awaited<ReturnType<typeof inspectImage>>;
  try {
    metadata = await inspectImage(buffer);
    if (metadata.width * metadata.height > MAX_PIXELS) {
      return jsonError("La imagen tiene demasiados píxeles.", 400, "invalid_image");
    }
  } catch {
    return jsonError("No pudimos validar la imagen.", 400, "invalid_image");
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("tool_analysis_requests")
    .select("id,status,result")
    .eq("user_id", user.id)
    .eq("client_request_id", clientRequestId)
    .maybeSingle();
  if (existing?.status === "succeeded" && existing.result) {
    return NextResponse.json({ analysis: existing.result, cached: true });
  }

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count } = await admin
    .from("tool_analysis_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["pending", "succeeded"])
    .gte("created_at", since.toISOString());
  if ((count || 0) >= config.analysisDailyLimit) {
    return jsonError(
      "Alcanzaste el límite diario de análisis.",
      429,
      "daily_limit",
    );
  }

  await ensureWelcomeCredits(user.id);
  const succeededToday = await admin
    .from("tool_analysis_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "succeeded")
    .gte("created_at", since.toISOString());
  const creditCost =
    (succeededToday.count || 0) < config.analysisFreeDailyLimit
      ? 0
      : config.analysisCreditCost;
  const requestId = existing?.id || crypto.randomUUID();
  if (!existing) {
    const { error: insertError } = await admin
      .from("tool_analysis_requests")
      .insert({
        id: requestId,
        user_id: user.id,
        client_request_id: clientRequestId,
        image_width: metadata.width,
        image_height: metadata.height,
        image_mime_type: metadata.mimeType,
        model: config.analysisModel,
      });
    if (insertError) {
      return jsonError("No pudimos preparar el análisis.", 500, "prepare_failed");
    }
  }

  let reservationId: string | null = null;
  if (creditCost > 0) {
    try {
      const reservation = await reserveCredits({
        userId: user.id,
        amount: creditCost,
        referenceType: "thumbnail_analysis",
        referenceId: requestId,
      });
      reservationId = reservation.reservationId;
    } catch (reason) {
      await admin
        .from("tool_analysis_requests")
        .update({
          status: "failed",
          error_code: "insufficient_credits",
          completed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("user_id", user.id);
      return jsonError(
        reason instanceof Error &&
          reason.message.includes("insufficient_credits")
          ? "No tienes créditos suficientes para este análisis."
          : "No pudimos reservar el crédito del análisis.",
        reason instanceof Error &&
          reason.message.includes("insufficient_credits")
          ? 402
          : 503,
        "credit_reservation_failed",
      );
    }
  }

  const started = Date.now();
  let creditsConsumed = false;
  try {
    const result = await analyzeThumbnail({
      buffer,
      mimeType: metadata.mimeType,
      model: config.analysisModel,
      apiKey,
    });
    let transactionId: string | null = null;
    let creditsRemaining: number | null = null;
    if (reservationId) {
      const consumed = await consumeReservedCredits({
        userId: user.id,
        reservationId,
        referenceType: "thumbnail_analysis",
        referenceId: requestId,
        description: "Análisis visual de miniatura",
      });
      creditsConsumed = true;
      transactionId = consumed.transactionId;
      creditsRemaining = consumed.creditsRemaining;
    }
    await admin
      .from("tool_analysis_requests")
      .update({
        status: "succeeded",
        result: result.analysis,
        credit_transaction_id: transactionId,
        completed_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("user_id", user.id);
    logger.info("tool.thumbnail_analysis_completed", {
      tool: "thumbnail-analyzer",
      userId: user.id,
      resourceId: requestId,
      durationMs: Date.now() - started,
      model: config.analysisModel,
      creditCost,
    });
    return NextResponse.json({
      analysis: result.analysis,
      creditCost,
      creditsRemaining,
    });
  } catch (reason) {
    if (reservationId && !creditsConsumed) {
      try {
        await releaseCredits(user.id, reservationId);
      } catch {
        logger.error("tool.thumbnail_analysis_credit_release_failed", {
          tool: "thumbnail-analyzer",
          userId: user.id,
          resourceId: requestId,
          errorCode: "credit_release_failed",
        });
      }
    }
    const code =
      reason instanceof Error ? reason.message : "analysis_provider_failed";
    await admin
      .from("tool_analysis_requests")
      .update({
        status: "failed",
        error_code: code.slice(0, 80),
        completed_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("user_id", user.id);
    logger.error("tool.thumbnail_analysis_failed", {
      tool: "thumbnail-analyzer",
      userId: user.id,
      resourceId: requestId,
      durationMs: Date.now() - started,
      errorCode: code,
    });
    return jsonError(
      code === "insufficient_credits"
        ? "No tienes créditos suficientes."
        : "No pudimos completar el análisis. Inténtalo otra vez.",
      code === "insufficient_credits" ? 402 : 502,
      code,
    );
  }
}
