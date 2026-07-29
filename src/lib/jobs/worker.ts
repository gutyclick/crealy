import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { buildEditInstruction } from "@/lib/editing/build-edit-instruction";
import { editImage } from "@/lib/editing/edit-image";
import { inspectImage } from "@/lib/editing/image-metadata";
import { resolveVersionSource } from "@/lib/editing/resolve-version-source";
import { getEditingServerEnv, getGenerationServerEnv } from "@/lib/env/server";
import { buildImagePrompt } from "@/lib/generation/build-image-prompt";
import { generateImage } from "@/lib/generation/generate-image";
import { loadGenerationReferences } from "@/lib/generation/load-generation-references";
import { mapGenerationOptions } from "@/lib/generation/map-generation-options";
import { classifyJobError } from "@/lib/jobs/retry-policy";
import { logger } from "@/lib/observability/logger";
import { getOperationsConfig } from "@/lib/operations/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { JobRecord } from "@/types/jobs";
import type { GenerationInput } from "@/types/generation";

const BUCKET = "generations";

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
  const { data } = await admin.storage.from(BUCKET).download(storagePath);
  if (!data || !generation.credit_reservation_id) return false;
  const buffer = Buffer.from(await data.arrayBuffer());
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
  return true;
}

async function processGeneration(job: JobRecord, startedAt: number) {
  const admin = createAdminClient();
  const { data: generation, error } = await admin
    .from("generations")
    .select(
      "id, user_id, project_id, status, user_prompt, content_type, requested_format, style, quality, primary_text, color_preference, custom_colors, credit_reservation_id",
    )
    .eq("id", job.resource_id)
    .eq("user_id", job.user_id)
    .maybeSingle();
  if (error || !generation) throw new Error("generation_not_found");
  if (!generation.credit_reservation_id) throw new Error("credit_reservation_missing");

  const config = getGenerationServerEnv();
  const storagePath = `${generation.user_id}/${generation.project_id}/${generation.id}.png`;
  if (
    await completeExistingGenerationFile(
      job,
      generation,
      storagePath,
      config.imageModel,
      startedAt,
    )
  ) {
    return;
  }

  const input: GenerationInput = {
    clientRequestId: job.idempotency_key.replace("generation:", ""),
    projectId: generation.project_id,
    contentType: generation.content_type as GenerationInput["contentType"],
    description: generation.user_prompt,
    primaryText: generation.primary_text ?? undefined,
    style: generation.style as GenerationInput["style"],
    colorPreference:
      generation.color_preference as GenerationInput["colorPreference"],
    customColors: generation.custom_colors ?? undefined,
    format: generation.requested_format as GenerationInput["format"],
    quality: generation.quality as GenerationInput["quality"],
  };

  const { data: referenceRows, error: referenceError } = await admin
    .from("generation_references")
    .select("upload_id")
    .eq("generation_id", generation.id)
    .eq("user_id", generation.user_id)
    .order("position");
  if (referenceError) throw referenceError;
  const referenceIds = referenceRows?.map((row) => row.upload_id) ?? [];
  const references = await loadGenerationReferences(
    admin,
    generation.user_id,
    referenceIds,
    getEditingServerEnv(),
  );
  const enhancedPrompt = buildImagePrompt(input);
  const outputOptions = mapGenerationOptions(input.format, input.quality);

  const { error: processingError } = await admin
    .from("generations")
    .update({
      status: "processing",
      enhanced_prompt: enhancedPrompt,
      output_size: outputOptions.size,
      model: config.imageModel,
      error_code: null,
    })
    .eq("id", generation.id)
    .eq("user_id", generation.user_id)
    .in("status", ["pending", "processing"]);
  if (processingError) throw processingError;

  const generated = await generateImage(input, enhancedPrompt, references);
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, generated.imageBuffer, {
      contentType: generated.mimeType,
      cacheControl: "3600",
      upsert: false,
    });
  if (uploadError && !uploadError.message.toLowerCase().includes("exist")) {
    throw new Error("storage_upload_failed");
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
}

async function processEdit(job: JobRecord, startedAt: number) {
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

  const { data: sourceBlob, error: downloadError } = await admin.storage
    .from(BUCKET)
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

  const storagePath = `${version.user_id}/edits/${version.session_id}/${version.id}.png`;
  const { data: existing } = await admin.storage.from(BUCKET).download(storagePath);
  let outputBuffer: Buffer;
  let outputModel = config.responsesModel;
  let providerResponseId: string | null = null;
  if (existing) {
    outputBuffer = Buffer.from(await existing.arrayBuffer());
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
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, outputBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadError && !uploadError.message.toLowerCase().includes("exist")) {
      throw new Error("storage_upload_failed");
    }
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
    userId: job.user_id,
    resourceId: job.resource_id,
    attempt: job.attempt_count,
    jobType: job.job_type,
  });

  try {
    if (job.job_type === "generation") await processGeneration(job, startedAt);
    else await processEdit(job, startedAt);
    logger.info("job.completed", {
      correlationId: job.correlation_id,
      jobId: job.id,
      userId: job.user_id,
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
        userId: job.user_id,
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
      userId: job.user_id,
      attempt: job.attempt_count,
      durationMs,
      errorCode: decision.errorCode,
    });
    return { status: "failed" as const };
  }
}

export async function maintainQueue() {
  const admin = createAdminClient();
  const [published, recovered, expiredRateLimits] = await Promise.all([
    admin.rpc("publish_job_outbox_internal", { p_limit: 100 }),
    admin.rpc("recover_stuck_jobs_internal", { p_limit: 100 }),
    admin
      .from("rate_limit_counters")
      .delete({ count: "exact" })
      .lt("expires_at", new Date().toISOString()),
  ]);
  return {
    published: published.data ?? 0,
    recovered: recovered.data ?? 0,
    expiredRateLimits: expiredRateLimits.count ?? 0,
  };
}
