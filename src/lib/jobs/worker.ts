import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { buildEditInstruction } from "@/lib/editing/build-edit-instruction";
import { editImage } from "@/lib/editing/edit-image";
import { inspectImage } from "@/lib/editing/image-metadata";
import { resolveVersionSource } from "@/lib/editing/resolve-version-source";
import { sendTransactionalEmail } from "@/lib/email/send-email";
import { EmailError } from "@/lib/email/email-errors";
import type { TransactionalEmailType } from "@/lib/email/templates";
import { queueTransactionalEmail } from "@/lib/email/queue-email";
import { getEditingServerEnv, getGenerationServerEnv } from "@/lib/env/server";
import { getPublicSiteUrl } from "@/lib/seo/get-public-site-url";
import { buildImagePrompt } from "@/lib/generation/build-image-prompt";
import { generateImage } from "@/lib/generation/generate-image";
import { loadGenerationReferences } from "@/lib/generation/load-generation-references";
import { mapGenerationOptions } from "@/lib/generation/map-generation-options";
import { createPreview } from "@/lib/image-processing/create-preview";
import { classifyJobError } from "@/lib/jobs/retry-policy";
import { logger } from "@/lib/observability/logger";
import { getOperationsConfig } from "@/lib/operations/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { JobRecord } from "@/types/jobs";
import type { GenerationInput } from "@/types/generation";
import { buildBrandStylePrompt } from "@/lib/brand-styles/build-style-prompt";
import { parseVisualAttributes } from "@/lib/brand-styles/service";
import {
  normalizeContentType,
  normalizeGenerationVariant,
} from "@/config/generation-products";
import { getPrivateStorage } from "@/lib/storage/provider";
import { getCreatedAssetRetentionDays } from "@/lib/storage/retention-policy";
import { generationAssetPath } from "@/lib/storage/storage-paths";
import {
  buildCorrectiveThumbnailPrompt,
  buildFallbackThumbnailPlan,
  evaluateThumbnail,
  planThumbnail,
} from "@/lib/generation/thumbnail-orchestrator";

async function retentionDaysForUser(userId: string) {
  const { data } = await createAdminClient()
    .from("subscriptions")
    .select("plan_key, status, current_period_end, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const periodEnd = data?.current_period_end
    ? new Date(data.current_period_end)
    : null;
  const hasActivePlan = Boolean(
    data &&
      (data.status === "active" || data.status === "trialing") &&
      periodEnd &&
      periodEnd > new Date(),
  );
  return getCreatedAssetRetentionDays(hasActivePlan ? data?.plan_key : "free");
}

async function recordOutput(jobId: string, buffer: Buffer) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("jobs")
    .update({
      output_sha256: createHash("sha256").update(buffer).digest("hex"),
      output_bytes: buffer.length,
    })
    .eq("id", jobId);
  if (error) throw error;
}

async function completeExistingGenerationFile(
  job: JobRecord,
  generation: {
    id: string;
    user_id: string;
    project_id: string;
    credit_reservation_id: string | null;
  },
  storagePath: string,
  model: string,
  startedAt: number,
) {
  const admin = createAdminClient();
  const buffer = await getPrivateStorage().get(storagePath);
  if (!buffer || !generation.credit_reservation_id) return false;
  const metadata = inspectImage(buffer);
  await recordOutput(job.id, buffer);
  const { error } = await admin.rpc("complete_generation_job_internal", {
    p_job_id: job.id,
    p_user_id: generation.user_id,
    p_generation_id: generation.id,
    p_reservation_id: generation.credit_reservation_id,
    p_storage_path: storagePath,
    p_mime_type: metadata.mimeType,
    p_width: metadata.width,
    p_height: metadata.height,
    p_model: model,
    p_provider_request_id: null,
    p_duration_ms: Date.now() - startedAt,
  });
  if (error) throw error;
  const previewBuffer = await createPreview(buffer);
  const previewPath = generationAssetPath({
    userId: generation.user_id,
    projectId: generation.project_id,
    generationId: generation.id,
    preview: true,
  });
  const provider = getPrivateStorage();
  await provider.put(previewPath, previewBuffer, "image/webp");
  const [{ data: originalAsset }, { data: previewAsset }] = await Promise.all([
    admin.from("assets").upsert({
      user_id: generation.user_id,
      kind: "generated_original",
      storage_provider: provider.name,
      bucket: provider.bucket,
      storage_key: storagePath,
      mime_type: metadata.mimeType,
      file_size_bytes: buffer.length,
      width: metadata.width,
      height: metadata.height,
      content_sha256: createHash("sha256").update(buffer).digest("hex"),
      status: "active",
    }, { onConflict: "storage_key" }).select("id").single(),
    admin.from("assets").upsert({
      user_id: generation.user_id,
      kind: "preview",
      storage_provider: provider.name,
      bucket: provider.bucket,
      storage_key: previewPath,
      mime_type: "image/webp",
      file_size_bytes: previewBuffer.length,
      content_sha256: createHash("sha256").update(previewBuffer).digest("hex"),
      status: "active",
    }, { onConflict: "storage_key" }).select("id").single(),
  ]);
  if (originalAsset && previewAsset) {
    await admin.from("generations").update({
      asset_id: originalAsset.id,
      preview_asset_id: previewAsset.id,
      provider_width: metadata.width,
      provider_height: metadata.height,
      export_width: metadata.width,
      export_height: metadata.height,
    }).eq("id", generation.id).eq("user_id", generation.user_id);
  }
  return true;
}

async function processGeneration(job: JobRecord, startedAt: number) {
  if (!job.user_id) throw new Error("generation_user_missing");
  const admin = createAdminClient();
  const { data: generation, error } = await admin
    .from("generations")
    .select(
      "id, user_id, project_id, status, user_prompt, content_type, platform, cover_platform, requested_format, variant, style, quality, primary_text, color_preference, custom_colors, credit_reservation_id, profile_mode, generation_metadata, brand_style_id, style_consistency",
    )
    .eq("id", job.resource_id)
    .eq("user_id", job.user_id)
    .maybeSingle();
  if (error || !generation) throw new Error("generation_not_found");
  if (!generation.credit_reservation_id) throw new Error("credit_reservation_missing");

  const config = getGenerationServerEnv();
  const storagePath = generationAssetPath({
    userId: generation.user_id,
    projectId: generation.project_id,
    generationId: generation.id,
  });
  if (
    await completeExistingGenerationFile(
      job,
      generation,
      storagePath,
      config.imageModel,
      startedAt,
    )
  ) {
    await queueLowCreditWarning(generation.user_id);
    return;
  }

  const normalizedContentType = normalizeContentType(generation.content_type);
  const normalizedVariant = normalizeGenerationVariant(
    generation.variant || generation.requested_format,
  );
  if (!normalizedContentType || !normalizedVariant) {
    throw new Error("generation_taxonomy_invalid");
  }
  const generationMetadata =
    generation.generation_metadata &&
    typeof generation.generation_metadata === "object"
      ? generation.generation_metadata as Record<string, unknown>
      : {};
  const normalizedQuality =
    generation.quality === "fast" ? "standard" : generation.quality;
  const input: GenerationInput = {
    clientRequestId: job.idempotency_key.replace("generation:", ""),
    projectId: generation.project_id,
    contentType: normalizedContentType,
    platform:
      (generation.platform as GenerationInput["platform"]) ??
      (generation.cover_platform as GenerationInput["platform"]) ??
      undefined,
    coverPlatform:
      (generation.cover_platform as GenerationInput["coverPlatform"]) ?? undefined,
    description: generation.user_prompt,
    primaryText: generation.primary_text ?? undefined,
    style: generation.style as GenerationInput["style"],
    colorPreference:
      generation.color_preference as GenerationInput["colorPreference"],
    customColors: generation.custom_colors ?? undefined,
    variant: normalizedVariant,
    format: normalizedVariant,
    quality: normalizedQuality as GenerationInput["quality"],
    profileMode:
      (generation.profile_mode as GenerationInput["profileMode"]) ?? undefined,
    profileIntensity:
      (generationMetadata.profileIntensity as GenerationInput["profileIntensity"]) ?? undefined,
    profileBackground:
      (generationMetadata.profileBackground as GenerationInput["profileBackground"]) ?? undefined,
    showSafeArea:
      typeof generationMetadata.showSafeArea === "boolean"
        ? generationMetadata.showSafeArea
        : undefined,
    videoTitle:
      typeof generationMetadata.videoTitle === "string"
        ? generationMetadata.videoTitle
        : undefined,
    thumbnailPreset:
      (generationMetadata.thumbnailPreset as GenerationInput["thumbnailPreset"]) ?? undefined,
    thumbnailTextMode:
      (generationMetadata.thumbnailTextMode as GenerationInput["thumbnailTextMode"]) ?? undefined,
    brandStyleId: generation.brand_style_id ?? undefined,
    styleConsistency: (generation.style_consistency as GenerationInput["styleConsistency"]) ?? undefined,
  };

  const { data: referenceRows, error: referenceError } = await admin
    .from("generation_references")
    .select("upload_id")
    .eq("generation_id", generation.id)
    .eq("user_id", generation.user_id)
    .order("position");
  if (referenceError) throw referenceError;
  const referenceIds = referenceRows?.map((row) => row.upload_id) ?? [];
  input.referenceUploadIds = referenceIds.length ? referenceIds : undefined;
  const references = await loadGenerationReferences(
    admin,
    generation.user_id,
    referenceIds,
    getEditingServerEnv(),
  );
  let brandStylePrompt: string | null = null;
  if (input.brandStyleId) {
    const { data: brandStyle } = await admin.from("brand_styles").select("*").eq("id", input.brandStyleId).eq("user_id", generation.user_id).eq("analysis_status", "ready").maybeSingle();
    if (!brandStyle) throw new Error("brand_style_not_found");
    const { data: styleRefs } = await admin.from("brand_style_references").select("storage_path, mime_type").eq("style_id", brandStyle.id).eq("user_id", generation.user_id).order("position");
    for (const [index, ref] of (styleRefs ?? []).entries()) {
      const buffer = await getPrivateStorage().get(ref.storage_path); if (!buffer) throw new Error("brand_style_reference_not_found");
      references.push({ buffer, mimeType: ref.mime_type as "image/png" | "image/jpeg" | "image/webp", filename: `brand-style-${index + 1}.webp` });
    }
    brandStylePrompt = buildBrandStylePrompt({ userPrompt: input.description, designType: input.contentType, brandStyle: { name: brandStyle.name, visualSummary: brandStyle.visual_summary, visualAttributes: parseVisualAttributes(brandStyle.visual_attributes) }, consistency: input.styleConsistency ?? "balanced", preset: input.thumbnailPreset, referenceCount: styleRefs?.length ?? 0 });
  }
  let thumbnailPlan = null;
  if (input.contentType === "thumbnail") {
    try {
      thumbnailPlan = await planThumbnail(input);
    } catch (planError) {
      thumbnailPlan = buildFallbackThumbnailPlan(input);
      logger.warn("generation.thumbnail_plan_fallback", {
        jobId: job.id,
        resourceId: generation.id,
        errorCode:
          typeof planError === "object" &&
          planError !== null &&
          "code" in planError
            ? String(planError.code || "provider_error").slice(0, 80)
            : "provider_error",
        providerStatus:
          typeof planError === "object" &&
          planError !== null &&
          "status" in planError
            ? Number(planError.status) || null
            : null,
        providerMessage:
          planError instanceof Error ? planError.message.slice(0, 240) : "unknown",
      });
    }
  }
  const basePrompt = thumbnailPlan?.finalPrompt ?? buildImagePrompt(input);
  const enhancedPrompt = brandStylePrompt ? `${basePrompt}\n\nMI ESTILO SELECCIONADO:\n${brandStylePrompt}` : basePrompt;
  const outputOptions = mapGenerationOptions(input.format, input.quality);

  const { error: processingError } = await admin
    .from("generations")
    .update({
      status: "processing",
      enhanced_prompt: enhancedPrompt,
      output_size: outputOptions.finalSize,
      model: config.imageModel,
      error_code: null,
    })
    .eq("id", generation.id)
    .eq("user_id", generation.user_id)
    .in("status", ["pending", "processing"]);
  if (processingError) throw processingError;

  let generated = await generateImage(input, enhancedPrompt, references);
  let thumbnailEvaluation = null;
  let wasAutomaticallyRegenerated = false;
  if (thumbnailPlan) {
    try {
      const firstEvaluation = await evaluateThumbnail({
        buffer: generated.imageBuffer,
        mimeType: generated.mimeType,
        input,
        plan: thumbnailPlan,
      });
      thumbnailEvaluation = firstEvaluation;
      if (!firstEvaluation.approved) {
        wasAutomaticallyRegenerated = true;
        const corrected = await generateImage(
          input,
          buildCorrectiveThumbnailPrompt(thumbnailPlan, firstEvaluation),
          references,
        );
        const correctedEvaluation = await evaluateThumbnail({
          buffer: corrected.imageBuffer,
          mimeType: corrected.mimeType,
          input,
          plan: thumbnailPlan,
        });
        if (correctedEvaluation.score >= firstEvaluation.score) {
          generated = corrected;
          thumbnailEvaluation = correctedEvaluation;
        }
      }
    } catch (evaluationError) {
      logger.warn("generation.thumbnail_evaluation_failed", {
        jobId: job.id,
        resourceId: generation.id,
        errorCode: evaluationError instanceof Error ? evaluationError.message : "unknown",
      });
    }
  }
  await getPrivateStorage()
    .put(storagePath, generated.imageBuffer, generated.mimeType)
    .catch(() => {
      throw new Error("storage_upload_failed");
    });
  const previewBuffer = await createPreview(generated.imageBuffer);
  const previewPath = generationAssetPath({
    userId: generation.user_id,
    projectId: generation.project_id,
    generationId: generation.id,
    preview: true,
  });
  await getPrivateStorage().put(previewPath, previewBuffer, "image/webp");
  const retentionDays = await retentionDaysForUser(generation.user_id);
  const previewRetentionDays = Number(process.env.PREVIEW_RETENTION_DAYS || 180);
  const originalExpiresAt = new Date(
    Date.now() + retentionDays * 86_400_000,
  ).toISOString();
  const previewExpiresAt = new Date(
    Date.now() + previewRetentionDays * 86_400_000,
  ).toISOString();
  const provider = getPrivateStorage();
  const [{ data: originalAsset, error: originalAssetError }, { data: previewAsset, error: previewAssetError }] =
    await Promise.all([
      admin
        .from("assets")
        .upsert(
          {
            user_id: generation.user_id,
            kind: "generated_original",
            storage_provider: provider.name,
            bucket: provider.bucket,
            storage_key: storagePath,
            mime_type: generated.mimeType,
            file_size_bytes: generated.imageBuffer.length,
            width: generated.exportWidth,
            height: generated.exportHeight,
            content_sha256: createHash("sha256").update(generated.imageBuffer).digest("hex"),
            status: "active",
            expires_at: originalExpiresAt,
          },
          { onConflict: "storage_key" },
        )
        .select("id")
        .single(),
      admin
        .from("assets")
        .upsert(
          {
            user_id: generation.user_id,
            kind: "preview",
            storage_provider: provider.name,
            bucket: provider.bucket,
            storage_key: previewPath,
            mime_type: "image/webp",
            file_size_bytes: previewBuffer.length,
            content_sha256: createHash("sha256").update(previewBuffer).digest("hex"),
            status: "active",
            expires_at: previewExpiresAt,
          },
          { onConflict: "storage_key" },
        )
        .select("id")
        .single(),
    ]);
  if (originalAssetError || previewAssetError || !originalAsset || !previewAsset) {
    throw originalAssetError || previewAssetError || new Error("asset_metadata_failed");
  }
  await recordOutput(job.id, generated.imageBuffer);

  const { error: completeError } = await admin.rpc(
    "complete_generation_job_internal",
    {
      p_job_id: job.id,
      p_user_id: generation.user_id,
      p_generation_id: generation.id,
      p_reservation_id: generation.credit_reservation_id,
      p_storage_path: storagePath,
      p_mime_type: generated.mimeType,
      p_width: generated.width,
      p_height: generated.height,
      p_model: config.imageModel,
      p_provider_request_id: generated.providerRequestId,
      p_duration_ms: Date.now() - startedAt,
    },
  );
  if (completeError) throw completeError;
  const { error: metadataError } = await admin
    .from("generations")
    .update({
      asset_id: originalAsset.id,
      preview_asset_id: previewAsset.id,
      provider_width: generated.providerWidth,
      provider_height: generated.providerHeight,
      export_width: generated.exportWidth,
      export_height: generated.exportHeight,
      size_fallback_used: generated.sizeFallbackUsed,
      size_fallback_reason: generated.sizeFallbackReason,
      generation_metadata: {
        ...generationMetadata,
        ...(thumbnailPlan
          ? {
              detectedNiche: thumbnailPlan.detectedNiche,
              nicheConfidence: thumbnailPlan.nicheConfidence,
              creativeBrief: thumbnailPlan.brief,
              concepts: thumbnailPlan.concepts,
              generatedText: thumbnailPlan.selectedConcept.thumbnailText,
              archetype: thumbnailPlan.selectedConcept.archetype,
              conceptStrategy: thumbnailPlan.selectedConcept.strategy,
              selectedConcept: thumbnailPlan.selectedConcept,
              finalPrompt: thumbnailPlan.finalPrompt,
              evaluationScore: thumbnailEvaluation?.score ?? null,
              criticalErrors: thumbnailEvaluation?.criticalErrors ?? [],
              evaluationProblems: thumbnailEvaluation?.problems ?? [],
              wasAutomaticallyRegenerated,
              shownResult: wasAutomaticallyRegenerated && thumbnailEvaluation
                ? "best_after_correction"
                : "initial",
            }
          : {}),
      },
    })
    .eq("id", generation.id)
    .eq("user_id", generation.user_id);
  if (metadataError) throw metadataError;
  await queueTransactionalEmail({
    userId: generation.user_id,
    type: "generation_ready",
    idempotencyKey: `generation-ready:${generation.id}`,
    data: { url: `${getPublicSiteUrl()}/generations/${generation.id}` },
  }).catch(() => null);
  await queueLowCreditWarning(generation.user_id);
  if (input.brandStyleId) logger.info("brand_style.generation_completed", { userId: generation.user_id, resourceId: generation.id, styleId: input.brandStyleId, contentType: input.contentType, consistency: input.styleConsistency ?? "balanced" });
}

async function processEdit(job: JobRecord, startedAt: number) {
  if (!job.user_id) throw new Error("edit_user_missing");
  const admin = createAdminClient();
  const { data: version, error } = await admin
    .from("edit_versions")
    .select(
      "id, session_id, user_id, parent_version_id, instruction, preserve_composition, credit_reservation_id",
    )
    .eq("id", job.resource_id)
    .eq("user_id", job.user_id)
    .maybeSingle();
  if (error || !version || !version.parent_version_id) {
    throw new Error("edit_version_not_found");
  }
  if (!version.credit_reservation_id) throw new Error("credit_reservation_missing");

  const { data: session } = await admin
    .from("edit_sessions")
    .select("current_version_id, previous_response_id")
    .eq("id", version.session_id)
    .eq("user_id", version.user_id)
    .maybeSingle();
  const { data: baseVersion } = await admin
    .from("edit_versions")
    .select(
      "storage_path, source_generation_id, source_upload_id, mime_type, width, height",
    )
    .eq("id", version.parent_version_id)
    .eq("session_id", version.session_id)
    .eq("user_id", version.user_id)
    .eq("status", "completed")
    .maybeSingle();
  if (!session || !baseVersion) throw new Error("base_version_missing");

  const source = await resolveVersionSource(admin, baseVersion);
  if (!source?.storagePath || !source.mimeType || !source.width || !source.height) {
    throw new Error("base_source_missing");
  }

  const config = getEditingServerEnv();
  const enhancedInstruction = buildEditInstruction({
    instruction: version.instruction || "",
    preserveComposition: version.preserve_composition,
    width: source.width,
    height: source.height,
  });
  const { error: processingError } = await admin
    .from("edit_versions")
    .update({
      status: "processing",
      enhanced_instruction: enhancedInstruction,
      model: config.responsesModel,
      error_code: null,
    })
    .eq("id", version.id)
    .eq("user_id", version.user_id)
    .in("status", ["pending", "processing"]);
  if (processingError) throw processingError;

  const sourceBuffer = await getPrivateStorage().get(source.storagePath);
  if (!sourceBuffer) throw new Error("source_download_failed");
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

  const storagePath = `${version.user_id}/edits/${version.session_id}/${version.id}.png`;
  const existing = await getPrivateStorage().get(storagePath);
  let outputBuffer: Buffer;
  let outputModel = config.responsesModel;
  let providerResponseId: string | null = null;
  if (existing) {
    outputBuffer = existing;
  } else {
    const generated = await editImage({
      imageBuffer: sourceBuffer,
      mimeType: sourceMetadata.mimeType,
      instruction: enhancedInstruction,
      previousResponseId:
        version.parent_version_id === session.current_version_id
          ? session.previous_response_id
          : null,
      width: sourceMetadata.width,
      height: sourceMetadata.height,
    });
    outputBuffer = generated.buffer;
    outputModel = generated.model;
    providerResponseId = generated.providerResponseId;
    await getPrivateStorage()
      .put(storagePath, outputBuffer, "image/png")
      .catch(() => {
        throw new Error("storage_upload_failed");
      });
  }

  const output = inspectImage(outputBuffer);
  await recordOutput(job.id, outputBuffer);
  const { error: completeError } = await admin.rpc("complete_edit_job_internal", {
    p_job_id: job.id,
    p_user_id: version.user_id,
    p_version_id: version.id,
    p_reservation_id: version.credit_reservation_id,
    p_storage_path: storagePath,
    p_mime_type: output.mimeType,
    p_width: output.width,
    p_height: output.height,
    p_model: outputModel,
    p_provider_response_id: providerResponseId,
    p_duration_ms: Date.now() - startedAt,
  });
  if (completeError) throw completeError;
  const previewBuffer = await createPreview(outputBuffer);
  const previewPath = `${version.user_id}/edits/${version.session_id}/previews/${version.id}.webp`;
  const provider = getPrivateStorage();
  await provider.put(previewPath, previewBuffer, "image/webp");
  const retentionDays = await retentionDaysForUser(version.user_id);
  const expiresAt = new Date(
    Date.now() + retentionDays * 86_400_000,
  ).toISOString();
  const previewExpiresAt = new Date(
    Date.now() + Number(process.env.PREVIEW_RETENTION_DAYS || 180) * 86_400_000,
  ).toISOString();
  const [{ data: asset }, { data: previewAsset }] = await Promise.all([
    admin.from("assets").upsert({
      user_id: version.user_id,
      kind: "edited_original",
      storage_provider: provider.name,
      bucket: provider.bucket,
      storage_key: storagePath,
      mime_type: output.mimeType,
      file_size_bytes: outputBuffer.length,
      width: output.width,
      height: output.height,
      content_sha256: createHash("sha256").update(outputBuffer).digest("hex"),
      status: "active",
      expires_at: expiresAt,
    }, { onConflict: "storage_key" }).select("id").single(),
    admin.from("assets").upsert({
      user_id: version.user_id,
      kind: "preview",
      storage_provider: provider.name,
      bucket: provider.bucket,
      storage_key: previewPath,
      mime_type: "image/webp",
      file_size_bytes: previewBuffer.length,
      content_sha256: createHash("sha256").update(previewBuffer).digest("hex"),
      status: "active",
      expires_at: previewExpiresAt,
    }, { onConflict: "storage_key" }).select("id").single(),
  ]);
  if (asset && previewAsset) {
    await admin.from("edit_versions").update({
      asset_id: asset.id,
      preview_asset_id: previewAsset.id,
    }).eq("id", version.id).eq("user_id", version.user_id);
  }
  await queueTransactionalEmail({
    userId: version.user_id,
    type: "edit_ready",
    idempotencyKey: `edit-ready:${version.id}`,
    data: { url: `${getPublicSiteUrl()}/edit/${version.session_id}` },
  }).catch(() => null);
  await queueLowCreditWarning(version.user_id);
}

async function queueLowCreditWarning(userId: string) {
  const threshold = Math.max(
    0,
    Math.min(100, Number(process.env.LOW_CREDIT_THRESHOLD || 3)),
  );
  const { data: account } = await createAdminClient()
    .from("credit_accounts")
    .select("available_balance")
    .eq("user_id", userId)
    .maybeSingle();
  if (!account || account.available_balance > threshold) return;
  const period = new Date().toISOString().slice(0, 7);
  await queueTransactionalEmail({
    userId,
    type: "low_credits",
    idempotencyKey: `low-credits:${userId}:${period}`,
    data: { credits: account.available_balance },
  }).catch(() => null);
}

async function processTransactionalEmail(job: JobRecord, startedAt: number) {
  const admin = createAdminClient();
  const payload = job.payload as {
    deliveryId?: string;
    audience?: "user" | "support";
    type?: TransactionalEmailType;
    data?: Record<string, string | number | boolean | null | undefined>;
  };
  if (
    payload.deliveryId !== job.resource_id ||
    !payload.type ||
    !payload.audience
  ) {
    throw new Error("email_payload_invalid");
  }
  const { data: delivery } = await admin
    .from("email_deliveries")
    .select("id, status, provider_message_id, idempotency_key, user_id")
    .eq("id", payload.deliveryId)
    .maybeSingle();
  if (!delivery) throw new Error("email_delivery_not_found");
  if (["sent", "delivered", "bounced", "complained"].includes(delivery.status)) {
    const completedAt = new Date().toISOString();
    await Promise.all([
      admin
        .from("jobs")
        .update({
          status: "completed",
          completed_at: completedAt,
          visibility_expires_at: null,
          updated_at: completedAt,
        })
        .eq("id", job.id),
      admin
        .from("job_attempts")
        .update({
          status: "completed",
          provider_request_id: delivery.provider_message_id,
          duration_ms: Date.now() - startedAt,
          finished_at: completedAt,
        })
        .eq("job_id", job.id)
        .eq("attempt_no", job.attempt_count),
    ]);
    return;
  }

  let recipient = "";
  if (payload.audience === "support") {
    recipient = process.env.SUPPORT_EMAIL_ADDRESS?.trim() || "";
  } else if (delivery.user_id) {
    const { data: authData } = await admin.auth.admin.getUserById(
      delivery.user_id,
    );
    if (authData.user?.email_confirmed_at) {
      recipient = authData.user.email || "";
    }
  }
  if (!recipient) throw new Error("email_recipient_unavailable");

  let templateData = payload.data || {};
  if (payload.type === "support_internal") {
    const supportRequestId =
      typeof templateData.supportRequestId === "string"
        ? templateData.supportRequestId
        : "";
    const { data: supportRequest } = await admin
      .from("support_requests")
      .select("category, subject, message, requester_email")
      .eq("id", supportRequestId)
      .maybeSingle();
    if (!supportRequest?.requester_email) {
      throw new Error("support_request_unavailable");
    }
    templateData = {
      ...templateData,
      category: supportRequest.category,
      subject: supportRequest.subject,
      message: supportRequest.message,
      email: supportRequest.requester_email,
    };
  }

  await admin
    .from("email_deliveries")
    .update({
      status: "processing",
      attempt_count: job.attempt_count,
      recipient_hash: createHash("sha256")
        .update(recipient.trim().toLowerCase())
        .digest("hex"),
      last_error_code: null,
    })
    .eq("id", delivery.id);

  try {
    const providerMessageId =
      delivery.provider_message_id ||
      (await sendTransactionalEmail({
        to: recipient,
        type: payload.type,
        data: templateData,
        idempotencyKey: delivery.idempotency_key,
      }));
    const completedAt = new Date().toISOString();
    await Promise.all([
      admin
        .from("email_deliveries")
        .update({
          status: "sent",
          provider_message_id: providerMessageId,
          sent_at: completedAt,
          last_error_code: null,
        })
        .eq("id", delivery.id),
      admin
        .from("jobs")
        .update({
          status: "completed",
          completed_at: completedAt,
          visibility_expires_at: null,
          updated_at: completedAt,
        })
        .eq("id", job.id),
      admin
        .from("job_attempts")
        .update({
          status: "completed",
          provider_request_id: providerMessageId,
          duration_ms: Date.now() - startedAt,
          finished_at: completedAt,
        })
        .eq("job_id", job.id)
        .eq("attempt_no", job.attempt_count),
    ]);
  } catch (error) {
    await admin
      .from("email_deliveries")
      .update({
        status: "failed",
        last_error_code:
          error instanceof EmailError
            ? error.code
            : error instanceof Error
              ? error.message.slice(0, 120)
              : "email_failed",
      })
      .eq("id", delivery.id);
    throw error;
  }
}

export async function processQueuedJob(jobId: string) {
  const config = getOperationsConfig();
  if (!config.workerEnabled) return { status: "disabled" as const };

  const admin = createAdminClient();
  const workerId = `vercel:${process.env.VERCEL_REGION || "local"}:${randomUUID()}`;
  await admin.rpc("publish_job_outbox_internal", { p_limit: 20 });
  await admin.rpc("recover_stuck_jobs_internal", { p_limit: 10 });

  const { data, error } = await admin.rpc("claim_job_internal", {
    p_job_id: jobId,
    p_worker_id: workerId,
    p_visibility_seconds: config.visibilitySeconds,
    p_global_concurrency: config.globalConcurrency,
    p_user_concurrency: config.userConcurrency,
  });
  const job = data?.[0] as JobRecord | undefined;
  if (error) throw error;
  if (!job) return { status: "not_claimed" as const };

  const { data: marked, error: markError } = await admin.rpc(
    "mark_job_processing_internal",
    { p_job_id: job.id, p_worker_id: workerId },
  );
  if (markError || !marked) return { status: "lost_claim" as const };

  const startedAt = Date.now();
  logger.info("job.started", {
    correlationId: job.correlation_id,
    jobId: job.id,
    userId: job.user_id || undefined,
    resourceId: job.resource_id,
    attempt: job.attempt_count,
    jobType: job.job_type,
  });

  try {
    if (job.job_type === "generation") await processGeneration(job, startedAt);
    else if (job.job_type === "edit") await processEdit(job, startedAt);
    else await processTransactionalEmail(job, startedAt);
    logger.info("job.completed", {
      correlationId: job.correlation_id,
      jobId: job.id,
      userId: job.user_id || undefined,
      resourceId: job.resource_id,
      attempt: job.attempt_count,
      durationMs: Date.now() - startedAt,
      jobType: job.job_type,
    });
    return { status: "completed" as const };
  } catch (caught) {
    const decision = classifyJobError(caught, job.attempt_count);
    const durationMs = Date.now() - startedAt;
    if (decision.retryable && job.attempt_count < job.max_attempts) {
      await admin.rpc("retry_job_internal", {
        p_job_id: job.id,
        p_error_code: decision.errorCode,
        p_delay_seconds: decision.delaySeconds,
        p_duration_ms: durationMs,
      });
      logger.warn("job.retry_scheduled", {
        correlationId: job.correlation_id,
        jobId: job.id,
        userId: job.user_id || undefined,
        attempt: job.attempt_count,
        durationMs,
        errorCode: decision.errorCode,
      });
      return { status: "retry_scheduled" as const };
    }
    await admin.rpc("fail_job_internal", {
      p_job_id: job.id,
      p_error_code: decision.errorCode,
      p_duration_ms: durationMs,
    });
    logger.error("job.failed", {
      correlationId: job.correlation_id,
      jobId: job.id,
      userId: job.user_id || undefined,
      attempt: job.attempt_count,
      durationMs,
      errorCode: decision.errorCode,
    });
    return { status: "failed" as const };
  }
}

export async function maintainQueue() {
  const admin = createAdminClient();
  const [published, recovered, expiredRateLimits, expiredUploads] = await Promise.all([
    admin.rpc("publish_job_outbox_internal", { p_limit: 100 }),
    admin.rpc("recover_stuck_jobs_internal", { p_limit: 100 }),
    admin
      .from("rate_limit_counters")
      .delete({ count: "exact" })
      .lt("expires_at", new Date().toISOString()),
    admin.rpc("list_expired_uploads_internal", { p_limit: 100 }),
  ]);

  let cleanedUploads = 0;
  for (const upload of expiredUploads.data ?? []) {
    try {
      await getPrivateStorage().remove(upload.storage_path);
      await admin
        .from("generation_references")
        .delete()
        .eq("upload_id", upload.upload_id);
      const { error } = await admin
        .from("user_uploads")
        .delete()
        .eq("id", upload.upload_id);
      if (!error) cleanedUploads += 1;
    } catch {
      logger.warn("storage.expired_cleanup_failed", {
        uploadId: upload.upload_id,
      });
    }
  }
  const now = new Date();
  const expirationNoticeStart = new Date(now.getTime() + 2 * 86_400_000);
  const expirationNoticeEnd = new Date(now.getTime() + 4 * 86_400_000);
  const { data: expiringSoon } = await admin
    .from("assets")
    .select("id, user_id, kind, expires_at")
    .eq("status", "active")
    .in("kind", ["generated_original", "edited_original"])
    .is("pinned_at", null)
    .gte("expires_at", expirationNoticeStart.toISOString())
    .lte("expires_at", expirationNoticeEnd.toISOString())
    .limit(100);
  for (const asset of expiringSoon ?? []) {
    const date = asset.expires_at?.slice(0, 10) || "pending";
    await queueTransactionalEmail({
      userId: asset.user_id,
      type: "asset_expiring",
      idempotencyKey: `asset-expiring:${asset.id}:${date}`,
      data: {
        name:
          asset.kind === "edited_original" ? "Tu imagen editada" : "Tu creación",
        date,
      },
    }).catch(() => null);
  }
  const { data: toExpire } = await admin
    .from("assets")
    .select("id")
    .in("status", ["active", "uploading"])
    .is("pinned_at", null)
    .lt("expires_at", now.toISOString())
    .limit(100);
  const expiredAssetIds = (toExpire ?? []).map((asset) => asset.id);
  if (expiredAssetIds.length) {
    await admin.from("assets").update({ status: "expired" }).in("id", expiredAssetIds);
  }
  const graceDays = Number(process.env.DELETION_GRACE_PERIOD_DAYS || 7);
  const deletionCutoff = new Date(now.getTime() - graceDays * 86_400_000).toISOString();
  const { data: toDelete } = await admin
    .from("assets")
    .select("id, storage_key")
    .eq("status", "expired")
    .is("pinned_at", null)
    .lt("updated_at", deletionCutoff)
    .limit(100);
  let cleanedAssets = 0;
  for (const asset of toDelete ?? []) {
    await admin.from("assets").update({ status: "deleting" }).eq("id", asset.id).eq("status", "expired");
    try {
      await getPrivateStorage().remove(asset.storage_key);
      await admin.from("assets").update({
        status: "deleted",
        deleted_at: new Date().toISOString(),
      }).eq("id", asset.id);
      cleanedAssets += 1;
    } catch {
      await admin.from("assets").update({ status: "expired" }).eq("id", asset.id);
    }
  }
  return {
    published: published.data ?? 0,
    recovered: recovered.data ?? 0,
    expiredRateLimits: expiredRateLimits.count ?? 0,
    cleanedUploads,
    expirationNoticesQueued: expiringSoon?.length ?? 0,
    expiredAssets: expiredAssetIds.length,
    cleanedAssets,
  };
}
