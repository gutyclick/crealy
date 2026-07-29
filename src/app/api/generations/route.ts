import { NextResponse } from "next/server";

import {
  completeGenerationWithCredits,
  CreditError,
  ensureWelcomeCredits,
  releaseCredits,
  reserveCredits,
} from "@/lib/credits/credit-service";
import { getGenerationCreditCost } from "@/lib/credits/get-credit-cost";
import {
  getEditingServerEnv,
  getGenerationServerEnv,
} from "@/lib/env/server";
import { buildImagePrompt } from "@/lib/generation/build-image-prompt";
import { buildProjectTitle } from "@/lib/generation/build-project-title";
import {
  GenerationError,
  mapOpenAIError,
} from "@/lib/generation/generation-errors";
import { generateImage } from "@/lib/generation/generate-image";
import { mapGenerationOptions } from "@/lib/generation/map-generation-options";
import { loadGenerationReferences } from "@/lib/generation/load-generation-references";
import { validateGenerationInput } from "@/lib/generation/validate-generation-input";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  GenerationErrorResponse,
  GenerationReferenceImage,
  GenerationResponse,
} from "@/types/generation";

export const runtime = "nodejs";
export const maxDuration = 180;

const MAX_REQUEST_BYTES = 20_000;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function errorResponse(
  body: GenerationErrorResponse,
  status: number,
) {
  return NextResponse.json(body, { status });
}

function mapReservationError(message: string) {
  if (message.includes("generation_active")) {
    return errorResponse(
      {
        code: "generation_active",
        error: "Ya tienes una imagen en proceso. Espera a que termine.",
      },
      429,
    );
  }

  if (message.includes("generation_limit")) {
    return errorResponse(
      {
        code: "generation_limit",
        error:
          "Has alcanzado temporalmente el límite de generaciones. Inténtalo más tarde.",
      },
      429,
    );
  }

  if (message.includes("generation_cooldown")) {
    return errorResponse(
      {
        code: "generation_cooldown",
        error: "Espera unos segundos antes de crear otra imagen.",
      },
      429,
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

  return errorResponse(
    {
      code: "internal_error",
      error: "No pudimos preparar la generación.",
    },
    500,
  );
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  let generationCompleted = false;
  let safeErrorCode = "unknown_generation_error";

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errorResponse(
      {
        code: "invalid_request",
        error: "Envía la solicitud como JSON.",
      },
      415,
    );
  }

  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse(
      {
        code: "unauthorized",
        error: "Inicia sesión para generar una imagen.",
      },
      401,
    );
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return errorResponse(
      {
        code: "invalid_request",
        error: "La solicitud es demasiado grande.",
      },
      413,
    );
  }

  let rawInput: unknown;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > MAX_REQUEST_BYTES) {
      return errorResponse(
        {
          code: "invalid_request",
          error: "La solicitud es demasiado grande.",
        },
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

  let serverConfig: ReturnType<typeof getGenerationServerEnv>;
  try {
    serverConfig = getGenerationServerEnv();
  } catch {
    return errorResponse(
      {
        code: "generation_disabled",
        error: "La generación con IA no está disponible en este momento.",
      },
      503,
    );
  }

  if (!serverConfig.generationEnabled) {
    return errorResponse(
      {
        code: "generation_disabled",
        error:
          "La generación está en mantenimiento. Inténtalo nuevamente más tarde.",
      },
      503,
    );
  }

  const input = validation.data;
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
  const projectTitle = buildProjectTitle(
    input.description,
    input.contentType,
  );

  const { data: reservationRows, error: reservationError } =
    await supabase.rpc("reserve_generation", {
      p_client_request_id: input.clientRequestId,
      p_project_id: input.projectId ?? null,
      p_title: projectTitle,
      p_user_prompt: input.description,
      p_content_type: input.contentType,
      p_requested_format: input.format,
      p_style: input.style,
      p_quality: input.quality,
      p_primary_text: input.primaryText ?? null,
      p_color_preference: input.colorPreference,
      p_custom_colors: input.customColors ?? null,
      p_daily_limit: 2_147_483_647,
      p_cooldown_seconds: 1,
    });

  if (reservationError || !reservationRows?.[0]) {
    return mapReservationError(reservationError?.message ?? "");
  }

  const reservation = reservationRows[0];
  const generationId = reservation.reserved_generation_id;
  const projectId = reservation.reserved_project_id;

  if (reservation.is_existing) {
    const { data: existing } = await supabase
      .from("generations")
      .select("status, storage_path, width, height, credit_cost")
      .eq("id", generationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.status === "completed" && existing.storage_path) {
      const { data: signedImage } = await supabase.storage
        .from("generations")
        .createSignedUrl(existing.storage_path, SIGNED_URL_TTL_SECONDS);

      if (signedImage?.signedUrl) {
        const { data: account } = await supabase
          .from("credit_accounts")
          .select("available_balance")
          .eq("user_id", user.id)
          .maybeSingle();
        return NextResponse.json<GenerationResponse>({
          generationId,
          projectId,
          status: "completed",
          imageUrl: signedImage.signedUrl,
          width: existing.width,
          height: existing.height,
          creditsUsed: existing.credit_cost ?? 0,
          creditsRemaining: account?.available_balance ?? 0,
        });
      }
    }

    return errorResponse(
      {
        code: "generation_in_progress",
        error:
          existing?.status === "failed"
            ? "La solicitud anterior no se completó. Inténtalo de nuevo."
            : "Esta imagen todavía está en proceso.",
      },
      409,
    );
  }

  let creditReservationId: string | null = null;
  const creditCost = getGenerationCreditCost(input.quality);

  try {
    const creditReservation = await reserveCredits({
      userId: user.id,
      amount: creditCost,
      referenceType: "generation",
      referenceId: generationId,
    });
    creditReservationId = creditReservation.reservationId;

    const { error: creditLinkError } = await admin
      .from("generations")
      .update({
        credit_reservation_id: creditReservationId,
        credit_cost: creditCost,
      })
      .eq("id", generationId)
      .eq("user_id", user.id);
    if (creditLinkError) {
      throw new CreditError("credit_reservation_failed");
    }

    const referenceUploadIds = input.referenceUploadIds ?? [];
    let referenceImages: GenerationReferenceImage[] = [];
    if (referenceUploadIds.length) {
      const { error: attachError } = await supabase.rpc(
        "attach_generation_references",
        {
          p_generation_id: generationId,
          p_upload_ids: referenceUploadIds,
        },
      );
      if (attachError) {
        throw new GenerationError(
          "invalid_reference",
          400,
          "No pudimos usar una de las imágenes de referencia.",
        );
      }
      try {
        referenceImages = await loadGenerationReferences(
          supabase,
          user.id,
          referenceUploadIds,
          getEditingServerEnv(),
        );
      } catch {
        throw new GenerationError(
          "invalid_reference",
          400,
          "Una referencia ya no está disponible o no es una imagen válida.",
        );
      }
    }

    const enhancedPrompt = buildImagePrompt(input);
    const mappedOutput = mapGenerationOptions(input.format, input.quality);

    const { error: processingError } = await admin
      .from("generations")
      .update({
        status: "processing",
        enhanced_prompt: enhancedPrompt,
        output_size: mappedOutput.size,
        model: serverConfig.imageModel,
      })
      .eq("id", generationId)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (processingError) {
      throw new GenerationError(
        "unknown_generation_error",
        500,
        "No pudimos iniciar la generación.",
      );
    }

    const generated = await generateImage(
      input,
      enhancedPrompt,
      referenceImages,
    );
    const storagePath = `${user.id}/${projectId}/${generationId}.${generated.extension}`;

    const { error: uploadError } = await supabase.storage
      .from("generations")
      .upload(storagePath, generated.imageBuffer, {
        contentType: generated.mimeType,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new GenerationError(
        "storage_upload_failed",
        500,
        "No pudimos guardar la imagen generada.",
      );
    }

    let creditResult;
    try {
      creditResult = await completeGenerationWithCredits({
        userId: user.id,
        generationId,
        reservationId: creditReservationId,
        storagePath,
        mimeType: generated.mimeType,
        width: generated.width,
        height: generated.height,
        model: serverConfig.imageModel,
        providerRequestId: generated.providerRequestId,
      });
    } catch {
      await supabase.storage.from("generations").remove([storagePath]);
      throw new GenerationError(
        "storage_upload_failed",
        500,
        "No pudimos guardar la imagen generada.",
      );
    }

    generationCompleted = true;

    const { data: signedImage, error: signedUrlError } = await supabase.storage
      .from("generations")
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

    if (signedUrlError || !signedImage?.signedUrl) {
      throw new GenerationError(
        "storage_upload_failed",
        500,
        "La imagen se guardó, pero no pudimos mostrarla en este momento.",
      );
    }

    console.info("[Crealy Generation]", {
      generationId,
      status: "completed",
      durationMs: Date.now() - startedAt,
      model: serverConfig.imageModel,
    });

    return NextResponse.json<GenerationResponse>(
      {
        generationId,
        projectId,
        status: "completed",
        imageUrl: signedImage.signedUrl,
          width: generated.width,
          height: generated.height,
          creditsUsed: creditResult.amount,
          creditsRemaining: creditResult.creditsRemaining,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof CreditError && error.code === "insufficient_credits") {
      await admin
        .from("generations")
        .update({ status: "failed", error_code: "insufficient_credits" })
        .eq("id", generationId)
        .eq("user_id", user.id)
        .in("status", ["pending", "processing"]);
      return errorResponse(
        {
          code: "insufficient_credits",
          error: "No tienes créditos suficientes para esta creación.",
        },
        402,
      );
    }

    const generationError = mapOpenAIError(error);
    safeErrorCode = generationError.code;

    if (!generationCompleted && generationId) {
      if (creditReservationId) {
        try {
          await releaseCredits(user.id, creditReservationId);
        } catch {
          console.error("[Crealy Credits]", {
            generationId,
            errorCode: "credit_release_failed",
          });
        }
      }
      await admin
        .from("generations")
        .update({
          status: "failed",
          error_code: generationError.code,
        })
        .eq("id", generationId)
        .eq("user_id", user.id)
        .in("status", ["pending", "processing"]);
    }

    console.error("[Crealy Generation]", {
      generationId,
      status: generationCompleted ? "completed_without_url" : "failed",
      errorCode: safeErrorCode,
      durationMs: Date.now() - startedAt,
      model: serverConfig.imageModel,
    });

    return errorResponse(
      {
        code:
          generationError.code === "storage_upload_failed"
            ? "storage_error"
            : generationError.code === "invalid_reference"
              ? "invalid_reference"
              : "provider_error",
        error: generationError.userMessage,
      },
      generationError.status,
    );
  }
}
