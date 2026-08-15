import "server-only";

import { logger } from "@/lib/observability/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import type { JobRecord } from "@/types/jobs";
import type { Json } from "@/types/database";

export const JOB_STAGES = [
  "waiting",
  "preparation",
  "generation",
  "evaluation",
  "correction",
  "processing_storage",
] as const;

export type JobStage = (typeof JOB_STAGES)[number];

function json(value: Record<string, unknown> = {}) {
  return JSON.parse(JSON.stringify(value)) as Json;
}

async function stageRpc(
  action: string,
  call: () => PromiseLike<{ error: { message: string } | null }>,
) {
  try {
    const { error } = await call();
    if (error) throw error;
  } catch (error) {
    logger.warn("job.stage_telemetry_failed", {
      action,
      errorCode: error instanceof Error ? error.message.slice(0, 100) : "stage_telemetry_failed",
    });
  }
}

export async function startJobStage(
  job: JobRecord,
  stage: JobStage,
  options?: { startedAt?: string; metadata?: Record<string, unknown> },
) {
  if (!job.user_id || job.job_type !== "generation") return;
  await stageRpc(`start:${stage}`, () =>
    createAdminClient().rpc("start_job_stage_internal", {
      p_job_id: job.id,
      p_generation_id: job.resource_id,
      p_user_id: job.user_id!,
      p_attempt_no: Math.max(1, job.attempt_count),
      p_stage: stage,
      p_started_at: options?.startedAt ?? new Date().toISOString(),
      p_metadata: json(options?.metadata),
    }),
  );
}

export async function finishJobStage(
  job: JobRecord,
  stage: JobStage,
  status: "completed" | "failed" = "completed",
  metadata?: Record<string, unknown>,
) {
  await stageRpc(`finish:${stage}`, () =>
    createAdminClient().rpc("finish_job_stage_internal", {
      p_job_id: job.id,
      p_attempt_no: Math.max(1, job.attempt_count),
      p_stage: stage,
      p_status: status,
      p_metadata: json(metadata),
    }),
  );
}

export async function runJobStage<T>(
  job: JobRecord,
  stage: JobStage,
  task: () => Promise<T>,
  metadata?: Record<string, unknown>,
) {
  await startJobStage(job, stage, { metadata });
  try {
    const result = await task();
    await finishJobStage(job, stage, "completed");
    return result;
  } catch (error) {
    await finishJobStage(job, stage, "failed", {
      errorCode: error instanceof Error ? error.message.slice(0, 120) : "unknown",
    });
    throw error;
  }
}

export async function recordWaitingStage(job: JobRecord) {
  const availableAt = new Date(job.available_at).getTime();
  const createdAt = new Date(job.created_at).getTime();
  const start = Number.isFinite(availableAt) && job.attempt_count > 1
    ? availableAt
    : createdAt;
  await startJobStage(job, "waiting", {
    startedAt: new Date(Number.isFinite(start) ? start : Date.now()).toISOString(),
    metadata: { queueAttempt: Math.max(1, job.attempt_count) },
  });
  await finishJobStage(job, "waiting");
}

export async function failOpenJobStages(job: JobRecord, errorCode: string) {
  await stageRpc("fail-open", () =>
    createAdminClient().rpc("fail_open_job_stages_internal", {
      p_job_id: job.id,
      p_attempt_no: Math.max(1, job.attempt_count),
      p_error_code: errorCode,
    }),
  );
}
