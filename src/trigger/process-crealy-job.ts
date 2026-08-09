import { logger, task } from "@trigger.dev/sdk";

function safeFailureCode(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const missingModule = message.match(/(?:Cannot find module|Could not resolve)\s+['\"]?([^'\"\s]+)/i);
  if (missingModule?.[1]) {
    return `trigger_bootstrap_module:${missingModule[1]}`.slice(0, 120);
  }

  return `trigger_bootstrap:${error instanceof Error ? error.name : "unknown"}`.slice(0, 120);
}

async function persistBootstrapFailure(jobId: string, code: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !secret) return;

  await fetch(`${url}/rest/v1/job_outbox?job_id=eq.${encodeURIComponent(jobId)}`, {
    method: "PATCH",
    headers: {
      apikey: secret,
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: JSON.stringify({
      last_error_code: code,
      updated_at: new Date().toISOString(),
    }),
  });
}

export const processCrealyJob = task({
  id: "crealy-process-job",
  machine: "small-2x",
  maxDuration: 900,
  queue: {
    concurrencyLimit: 3,
  },
  retry: {
    maxAttempts: 1,
  },
  run: async ({ jobId }: { jobId: string }) => {
    logger.info("Processing Crealy job", { jobId });
    try {
      // Load the Next.js backend graph only after Trigger has started the task.
      // This makes container-only bootstrap errors observable and keeps them
      // separate from a genuine generation failure.
      const { processQueuedJob } = await import("@/lib/jobs/worker");
      const result = await processQueuedJob(jobId);
      logger.info("Crealy job processing finished", {
        jobId,
        status: result.status,
      });
      return result;
    } catch (error) {
      const code = safeFailureCode(error);
      logger.error("Crealy worker bootstrap failed", {
        jobId,
        code,
        error,
      });
      await persistBootstrapFailure(jobId, code).catch(() => undefined);
      throw error;
    }
  },
});
