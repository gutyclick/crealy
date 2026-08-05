import { logger, task } from "@trigger.dev/sdk";

import { processQueuedJob } from "@/lib/jobs/worker";

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
    const result = await processQueuedJob(jobId);
    logger.info("Crealy job processing finished", { jobId, status: result.status });
    return result;
  },
});
