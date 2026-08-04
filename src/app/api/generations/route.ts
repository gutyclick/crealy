import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { ensureWelcomeCredits } from "@/lib/credits/credit-service";
import { getGenerationCreditCost } from "@/lib/credits/get-generation-credit-cost";
import { getGenerationServerEnv } from "@/lib/env/server";
import { buildProjectTitle } from "@/lib/generation/build-project-title";
import { checkImageProvider } from "@/lib/generation/check-image-provider";
import { validateGenerationInput } from "@/lib/generation/validate-generation-input";
import { logger } from "@/lib/observability/logger";
import { getOperationsConfig } from "@/lib/operations/config";
import { getGenerationVariant } from "@/config/generation-products";
import {
  enforceRateLimit,
  RATE_LIMITS,
} from "@/lib/operations/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { GenerationErrorResponse } from "@/types/generation";
import type { QueuedGenerationResponse } from "@/types/jobs";
import { getBrandStyleAccess, requireOwnedStyle } from "@/lib/brand-styles/service";

export const runtime = "nodejs";
export const maxDuration = 180;

const MAX_REQUEST_BYTES = 20_000;

function errorResponse(
  body: GenerationErrorResponse,
  status: number,
  headers?: HeadersInit,
) {
  return NextResponse.json(body, { status, headers });
}

function reservationError(message: string, correlationId?: string) {
  if (
    message.includes("insufficient_credits") ||
    message.includes("credit_allocation_failed")
  ) {
    return errorResponse(
      {
        code: "insufficient_credits",
        error: "No tienes créditos suficientes para esta creación.",
      },
      402,
    );
  }
  if (message.includes("generation_active")) {
    return errorResponse(
      {
        code: "generation_active",
        error: "Ya tienes un diseño en proceso. Espera a que termine.",
      },
      429,
    );
  }
  if (message.includes("generation_queue_limit")) {
    return errorResponse(
      {
        code: "generation_limit",
        error: "Ya tienes cuatro creaciones en cola. Espera a que termine una para añadir otra.",
      },
      429,
    );
  }
  if (message.includes("generation_limit")) {
    return errorResponse(
      {
        code: "generation_limit",
        error: "Alcanzaste el límite diario de generaciones.",
      },
      429,
    );
  }
  if (message.includes("generation_cooldown")) {
    return errorResponse(
      {
        code: "generation_cooldown",
        error: "Espera unos segundos antes de crear otro diseño.",
      },
      429,
    );
  }
  if (
    message.includes("daily_budget_exceeded") ||
    message.includes("monthly_budget_exceeded")
  ) {
    return errorResponse(
      {
        code: "generation_disabled",
        error:
          "La generación alcanzó temporalmente su capacidad operativa. Inténtalo más tarde.",
      },
      503,
    );
  }
  if (message.includes("project_not_found")) {
    return errorResponse(
      {
        code: "invalid_request",
        error: "No encontramos el proyecto que intentas continuar.",
      },
      404,
    );
  }
  if (message.includes("invalid_reference")) {
    return errorResponse(
      {
        code: "invalid_reference",
        error: "Una imagen de referencia ya no está disponible.",
      },
      400,
    );
  }
  return errorResponse(
    {
      code: "internal_error",
      error: `No pudimos preparar la generación.${correlationId ? ` Referencia: ${correlationId.slice(0, 8)}.` : ""}`,
    },
    500,
  );
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errorResponse(
      { code: "invalid_request", error: "Envía la solicitud como JSON." },
      415,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse(
      { code: "unauthorized", error: "Inicia sesión para generar una imagen." },
      401,
    );
  }
  if (!user.email_confirmed_at) {
    return errorResponse(
      {
        code: "unauthorized",
        error: "Confirma tu correo antes de crear un diseño.",
      },
      403,
    );
  }

  try {
    const rateLimit = await enforceRateLimit({
      request,
      userId: user.id,
      action: "generation.create",
      userPolicy: RATE_LIMITS.generationUser,
      ipPolicy: RATE_LIMITS.generationIp,
    });
    if (!rateLimit.allowed) {
      return errorResponse(
        {
          code: "generation_limit",
          error: "Hay demasiadas solicitudes. Espera un momento.",
        },
        429,
        { "Retry-After": String(rateLimit.retryAfter) },
      );
    }
  } catch {
    return errorResponse(
      {
        code: "internal_error",
        error: "No pudimos validar la solicitud. Inténtalo de nuevo.",
      },
      503,
    );
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return errorResponse(
      { code: "invalid_request", error: "La solicitud es demasiado grande." },
      413,
    );
  }

  let rawInput: unknown;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > MAX_REQUEST_BYTES) {
      return errorResponse(
        { code: "invalid_request", error: "La solicitud es demasiado grande." },
        413,
      );
    }
    rawInput = JSON.parse(body);
  } catch {
    return errorResponse(
      {
        code: "invalid_request",
        error: "La solicitud no contiene JSON válido.",
      },
      400,
    );
  }

  const validation = validateGenerationInput(rawInput);
  if (!validation.success) {
    return errorResponse(
      {
        code: "invalid_request",
        error: "Revisa los campos marcados.",
        fields: validation.fields,
      },
      400,
    );
  }

  let generationConfig: ReturnType<typeof getGenerationServerEnv>;
  let operations: ReturnType<typeof getOperationsConfig>;
  try {
    generationConfig = getGenerationServerEnv();
    operations = getOperationsConfig();
  } catch {
    return errorResponse(
      {
        code: "generation_disabled",
        error: "La generación con IA no está disponible en este momento.",
      },
      503,
    );
  }
  if (!generationConfig.generationEnabled || !operations.workerEnabled) {
    return errorResponse(
      {
        code: "generation_disabled",
        error: "La generación está en mantenimiento. Inténtalo más tarde.",
      },
      503,
    );
  }

  const imageProvider = await checkImageProvider();
  if (!imageProvider.ok) {
    logger.error("generation.provider_not_ready", {
      userId: user.id,
      errorCode: imageProvider.code,
      model: imageProvider.model,
    });
    return errorResponse(
      {
        code: "generation_disabled",
        error:
          imageProvider.code === "provider_auth_error"
            ? "La conexión con OpenAI necesita una clave válida. Revisa OPENAI_API_KEY en Vercel."
            : imageProvider.code === "provider_model_unavailable"
              ? `El modelo ${imageProvider.model} no está disponible para la cuenta configurada.`
              : "OpenAI no está disponible en este momento. Inténtalo nuevamente en unos minutos.",
      },
      503,
    );
  }

  try {
    await ensureWelcomeCredits(user.id);
  } catch {
    return errorResponse(
      {
        code: "internal_error",
        error: "No pudimos consultar tus créditos. Inténtalo de nuevo.",
      },
      503,
    );
  }

  const input = validation.data;
  if (input.brandStyleId) {
    try {
      const [brandStyle, access] = await Promise.all([requireOwnedStyle(user.id, input.brandStyleId), getBrandStyleAccess(user.id)]);
      if (!access.entitlement.enabled || brandStyle.analysis_status !== "ready" || !access.entitlement.supportedDesignTypes.includes(input.contentType) || !brandStyle.supported_design_types.includes(input.contentType)) {
        return errorResponse({ code: "invalid_request", error: "Este estilo no está disponible para el tipo de diseño o plan actual." }, 403);
      }
    } catch {
      return errorResponse({ code: "invalid_request", error: "No encontramos el estilo guardado seleccionado." }, 404);
    }
  }
  const variantDefinition = getGenerationVariant(input.variant);
  if (!variantDefinition) {
    return errorResponse(
      { code: "invalid_request", error: "La variante seleccionada no está disponible." },
      400,
    );
  }
  const creditCost = getGenerationCreditCost({
    contentType: input.contentType,
    variant: input.variant,
    platform: input.platform,
    quality: input.quality,
  });
  const admin = createAdminClient();
  const estimatedCost =
    input.quality === "high"
      ? operations.generationHighCostUsd
      : operations.generationStandardCostUsd;
  const { data, error } = await admin.rpc("create_generation_job_internal", {
    p_user_id: user.id,
    p_client_request_id: input.clientRequestId,
    p_project_id: input.projectId ?? null,
    p_title: buildProjectTitle(input.description, input.contentType),
    p_user_prompt: input.description,
    p_content_type: input.contentType,
    p_requested_format: input.format,
    p_style: input.style,
    p_quality: input.quality,
    p_primary_text: input.primaryText ?? null,
    p_color_preference: input.colorPreference,
    p_custom_colors: input.customColors ?? null,
    p_reference_upload_ids: input.referenceUploadIds ?? [],
    p_input_hash: createHash("sha256")
      .update(JSON.stringify(input))
      .digest("hex"),
    p_credit_cost: creditCost,
    p_daily_limit: generationConfig.dailyLimit,
    p_cooldown_seconds: generationConfig.cooldownSeconds,
    p_estimated_cost_usd: estimatedCost,
    p_daily_budget_usd: operations.dailyBudgetUsd,
    p_monthly_budget_usd: operations.monthlyBudgetUsd,
  });
  if (error || !data?.[0]) {
    logger.error("generation.prepare_failed", {
      correlationId: input.clientRequestId,
      userId: user.id,
      errorCode: error?.code ?? "empty_rpc_result",
      databaseMessage: error?.message?.slice(0, 160) ?? null,
      databaseHint: error?.hint?.slice(0, 160) ?? null,
    });
    return reservationError(error?.message ?? "", input.clientRequestId);
  }

  const queued = data[0];
  let referenceAssetId: string | null = null;
  if (input.referenceUploadIds?.[0]) {
    const { data: referenceUpload } = await admin
      .from("user_uploads")
      .select("asset_id")
      .eq("id", input.referenceUploadIds[0])
      .eq("user_id", user.id)
      .maybeSingle();
    referenceAssetId = referenceUpload?.asset_id ?? null;
  }
  {
    const { error: platformError } = await admin
      .from("generations")
      .update({
        platform: input.platform ?? null,
        cover_platform: input.coverPlatform ?? null,
        variant: input.variant,
        credit_cost: creditCost,
        requested_width: variantDefinition.width,
        requested_height: variantDefinition.height,
        profile_mode: input.profileMode ?? null,
        reference_asset_id: referenceAssetId,
        generation_metadata: {
          profileIntensity: input.profileIntensity ?? null,
          profileBackground: input.profileBackground ?? null,
          showSafeArea: input.showSafeArea ?? false,
          videoTitle: input.videoTitle ?? null,
          thumbnailPreset: input.thumbnailPreset ?? null,
          thumbnailTextMode: input.thumbnailTextMode ?? null,
          generationCount: 1,
          downloaded: false,
          variationRequested: false,
          selectedByUser: false,
          generationIntent: input.generationIntent ?? "initial",
          parentGenerationId: input.parentGenerationId ?? null,
          brandStyleId: input.brandStyleId ?? null,
          styleConsistency: input.styleConsistency ?? null,
          creationMode: input.creationMode ?? "create",
          recreateSimilarity: input.recreateSimilarity ?? null,
          recreateBlueprint: input.recreateBlueprint ?? null,
        },
        brand_style_id: input.brandStyleId ?? null,
        style_consistency: input.styleConsistency ?? null,
      })
      .eq("id", queued.generation_id)
      .eq("user_id", user.id);
    if (platformError) {
      logger.error("generation.metadata_failed", {
        correlationId: input.clientRequestId,
        userId: user.id,
        resourceId: queued.generation_id,
        errorCode: platformError.code,
        databaseMessage: platformError.message.slice(0, 160),
      });
      return reservationError(platformError.message, input.clientRequestId);
    }
  }
  if (input.parentGenerationId) {
    const { data: parent } = await admin
      .from("generations")
      .select("generation_metadata")
      .eq("id", input.parentGenerationId)
      .eq("user_id", user.id)
      .maybeSingle();
    const parentMetadata = parent?.generation_metadata && typeof parent.generation_metadata === "object"
      ? parent.generation_metadata as Record<string, unknown>
      : {};
    await admin
      .from("generations")
      .update({ generation_metadata: { ...parentMetadata, variationRequested: true, selectedByUser: true } })
      .eq("id", input.parentGenerationId)
      .eq("user_id", user.id);
  }
  const { data: jobReady, error: jobReadyError } = await admin.rpc("mark_job_ready_internal", {
    p_job_id: queued.job_id,
    p_user_id: user.id,
    p_max_attempts: operations.maxAttempts,
  });
  if (jobReadyError || !jobReady) {
    logger.error("job.ready_failed", { jobId: queued.job_id, userId: user.id, resourceId: queued.generation_id, errorCode: jobReadyError?.code || "not_marked_ready" });
    return reservationError("job_not_ready", input.clientRequestId);
  }
  logger.info("job.accepted", {
    jobId: queued.job_id,
    userId: user.id,
    resourceId: queued.generation_id,
    jobType: "generation",
    duplicate: queued.is_existing,
  });
  return NextResponse.json<QueuedGenerationResponse>(
    {
      jobId: queued.job_id,
      generationId: queued.generation_id,
      projectId: queued.project_id,
      status:
        queued.job_status === "processing" ? "processing" : "queued",
    },
    { status: 202, headers: { Location: `/api/jobs/${queued.job_id}` } },
  );
}
