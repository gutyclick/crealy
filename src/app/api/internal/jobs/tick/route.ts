import { NextResponse } from "next/server";

import { maintainQueue, processQueuedJob } from "@/lib/jobs/worker";
import { logger } from "@/lib/observability/logger";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 180;
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(
    secret &&
      (request.headers.get("authorization") === `Bearer ${secret}` ||
        request.headers.get("x-crealy-cron-secret") === secret),
  );
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  logger.info("queue.consumer_started");
  const maintenance = await maintainQueue();
  const admin = createAdminClient();
  const availableAt = new Date().toISOString();
  const [readyJobs, emailJobs] = await Promise.all([
    admin
      .from("jobs")
      .select("id, job_type, payload, priority, created_at")
      .contains("payload", { ready: true })
      .in("status", ["queued", "retry_scheduled"])
      .lte("available_at", availableAt)
      .order("priority")
      .order("created_at")
      .limit(3),
    admin
      .from("jobs")
      .select("id, job_type, payload, priority, created_at")
      .eq("job_type", "send_transactional_email")
      .in("status", ["queued", "retry_scheduled"])
      .lte("available_at", availableAt)
      .order("priority")
      .order("created_at")
      .limit(3),
  ]);
  if (readyJobs.error || emailJobs.error) {
    logger.error("queue.tick_failed", { errorCode: "job_list_failed" });
    return NextResponse.json({ error: "Queue unavailable" }, { status: 503 });
  }

  const data = [...(readyJobs.data ?? []), ...(emailJobs.data ?? [])]
    .filter((job, index, jobs) => jobs.findIndex((item) => item.id === job.id) === index)
    .sort((a, b) => a.priority - b.priority || a.created_at.localeCompare(b.created_at))
    .slice(0, 3);

  const results = [];
  for (const job of data) {
    results.push({ id: job.id, ...(await processQueuedJob(job.id)) });
  }
  logger.info("queue.consumer_completed", {
    durationMs: Date.now() - startedAt,
    processedCount: results.length,
  });
  return NextResponse.json({
    ok: true,
    maintenance,
    processed: results,
    timestamp: new Date().toISOString(),
  });
}
