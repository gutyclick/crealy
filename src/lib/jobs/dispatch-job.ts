import "server-only";

import { logger } from "@/lib/observability/logger";

export type JobDispatchResult =
  | { provider: "trigger.dev"; dispatched: true; runId: string }
  | { provider: "recovery-cron"; dispatched: false; reason: "disabled" | "dispatch_failed" };

export async function dispatchQueuedJob(jobId: string): Promise<JobDispatchResult> {
  if (process.env.TRIGGER_ENABLED !== "true" || !process.env.TRIGGER_SECRET_KEY?.trim()) {
    logger.warn("job.trigger_dispatch_skipped", { jobId, errorCode: "trigger_not_configured" });
    return { provider: "recovery-cron", dispatched: false, reason: "disabled" };
  }

  try {
    const response = await fetch(
      "https://api.trigger.dev/api/v1/tasks/crealy-process-job/trigger",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.TRIGGER_SECRET_KEY.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: { jobId },
          options: {
            idempotencyKey: `crealy-job:${jobId}`,
            ttl: "30d",
          },
        }),
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok) throw new Error(`trigger_http_${response.status}`);
    const handle = await response.json() as { id?: unknown };
    if (typeof handle.id !== "string") throw new Error("trigger_invalid_response");
    logger.info("job.trigger_dispatched", { jobId, resourceId: handle.id });
    return { provider: "trigger.dev", dispatched: true, runId: handle.id };
  } catch (error) {
    logger.error("job.trigger_dispatch_failed", {
      jobId,
      errorCode: error instanceof Error ? error.message.slice(0, 120) : "unknown",
    });
    return { provider: "recovery-cron", dispatched: false, reason: "dispatch_failed" };
  }
}
