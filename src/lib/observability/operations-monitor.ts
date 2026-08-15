import "server-only";

import * as Sentry from "@sentry/nextjs";

import { getOperationsConfig } from "@/lib/operations/config";
import { createAdminClient } from "@/lib/supabase/admin";

type Alert = { key: string; value: number; threshold: number; unit: string };

const numericEnv = (name: string, fallback: number) => {
  const value = Number(process.env[name] || fallback);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

function emitAlert(alert: Alert) {
  Sentry.withScope((scope) => {
    scope.setLevel("error");
    scope.setTag("operational_alert", alert.key);
    scope.setFingerprint(["crealy-operational-alert", alert.key]);
    scope.setContext("threshold", alert);
    Sentry.captureMessage(`Crealy operational alert: ${alert.key}`);
  });
}

export async function inspectOperationalHealth() {
  const admin = createAdminClient();
  const now = Date.now();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const stuckBefore = new Date(now - numericEnv("ALERT_STUCK_JOB_MINUTES", 15) * 60_000).toISOString();
  const reservationBefore = new Date(now - numericEnv("ALERT_OPEN_RESERVATION_MINUTES", 30) * 60_000).toISOString();

  const [metricsResult, stuckResult, reservationsResult, usageResult, actualCostResult, reservedCostResult, productResult] = await Promise.all([
    admin.from("operational_metrics").select("metric_name, dimension, metric_value").eq("metric_date", today.toISOString().slice(0, 10)),
    admin.from("jobs").select("id", { count: "exact", head: true }).in("status", ["queued", "claimed", "processing", "retry_scheduled"]).lt("updated_at", stuckBefore),
    admin.from("credit_reservations").select("id", { count: "exact", head: true }).eq("status", "reserved").lt("created_at", reservationBefore),
    admin.from("provider_usage").select("job_id, estimated_cost_usd").gte("created_at", today.toISOString()),
    admin.from("provider_cost_events").select("job_id, actual_cost_usd, estimated_cost_usd").gte("created_at", today.toISOString()),
    admin.from("jobs").select("estimated_cost_usd").in("status", ["queued", "claimed", "processing", "retry_scheduled"]).gte("created_at", today.toISOString()),
    admin.rpc("product_analytics_internal", {
      p_from: new Date(now - 30 * 86_400_000).toISOString(),
      p_to: new Date(now).toISOString(),
    }),
  ]);

  const queryError = [metricsResult.error, stuckResult.error, reservationsResult.error, usageResult.error, actualCostResult.error, reservedCostResult.error, productResult.error].find(Boolean);
  if (queryError) throw queryError;

  const metric = (name: string, dimension: string) => Number(metricsResult.data?.find((row) => row.metric_name === name && row.dimension === dimension)?.metric_value || 0);
  const generationCreated = metric("jobs_created", "generation");
  const generationFailed = metric("jobs_failed", "generation");
  const failureRate = generationCreated ? generationFailed / generationCreated : 0;
  const detailedJobs = new Set((actualCostResult.data || []).map((row) => row.job_id));
  const detailedSpend = (actualCostResult.data || []).reduce((sum, row) => sum + Number(row.actual_cost_usd ?? row.estimated_cost_usd ?? 0), 0);
  const legacySpend = (usageResult.data || [])
    .filter((row) => !detailedJobs.has(row.job_id))
    .reduce((sum, row) => sum + Number(row.estimated_cost_usd || 0), 0);
  const dailySpend = detailedSpend + legacySpend + (reservedCostResult.data || []).reduce((sum, row) => sum + Number(row.estimated_cost_usd || 0), 0);
  const dailyBudget = getOperationsConfig().dailyBudgetUsd;
  const product = productResult.data && typeof productResult.data === "object" && !Array.isArray(productResult.data)
    ? productResult.data as Record<string, unknown>
    : {};
  const productSummary = product.summary && typeof product.summary === "object" && !Array.isArray(product.summary)
    ? product.summary as Record<string, unknown>
    : {};
  const approvalRate = Number(productSummary.approvalRate || 0);
  const downloadRate = Number(productSummary.downloadRate || 0);
  const grossMarginUsd = Number(productSummary.grossMarginUsd || 0);
  const completedResults = Number(productSummary.completedResults || 0);
  const alerts: Alert[] = [];

  const failureThreshold = numericEnv("ALERT_GENERATION_FAILURE_RATE", 0.15);
  if (generationCreated >= numericEnv("ALERT_GENERATION_MIN_SAMPLE", 5) && failureRate >= failureThreshold) alerts.push({ key: "generation_failure_rate", value: failureRate, threshold: failureThreshold, unit: "ratio" });
  if ((stuckResult.count || 0) > 0) alerts.push({ key: "stuck_jobs", value: stuckResult.count || 0, threshold: 0, unit: "jobs" });
  if ((reservationsResult.count || 0) > 0) alerts.push({ key: "open_credit_reservations", value: reservationsResult.count || 0, threshold: 0, unit: "reservations" });
  if (dailyBudget && dailySpend / dailyBudget >= numericEnv("ALERT_DAILY_BUDGET_RATIO", 0.8)) alerts.push({ key: "daily_openai_budget", value: dailySpend, threshold: dailyBudget, unit: "usd" });
  if (completedResults >= numericEnv("ALERT_MARGIN_MIN_SAMPLE", 10) && grossMarginUsd < 0) alerts.push({ key: "negative_generation_margin_30d", value: grossMarginUsd, threshold: 0, unit: "usd" });
  alerts.forEach(emitAlert);

  Sentry.metrics.gauge("crealy.generation.failure_rate", failureRate);
  Sentry.metrics.gauge("crealy.jobs.stuck", stuckResult.count || 0);
  Sentry.metrics.gauge("crealy.credits.open_reservations", reservationsResult.count || 0);
  Sentry.metrics.gauge("crealy.openai.daily_spend_usd", dailySpend);
  Sentry.metrics.gauge("crealy.product.approval_rate_30d", approvalRate);
  Sentry.metrics.gauge("crealy.product.download_rate_30d", downloadRate);
  Sentry.metrics.gauge("crealy.product.gross_margin_usd_30d", grossMarginUsd);

  return { healthy: alerts.length === 0, alertCount: alerts.length, checkedAt: new Date().toISOString() };
}

export function recordOpenAiLatency(durationMs: number, operation: string) {
  Sentry.metrics.distribution("crealy.openai.latency_ms", durationMs, { unit: "millisecond", attributes: { operation } });
  const threshold = numericEnv("ALERT_OPENAI_LATENCY_MS", 90_000);
  if (durationMs >= threshold) emitAlert({ key: `openai_latency_${operation}`, value: durationMs, threshold, unit: "ms" });
}

export function recordStorageError(operation: string, error: unknown) {
  Sentry.withScope((scope) => {
    scope.setTag("operational_alert", "storage_error");
    scope.setTag("storage_operation", operation);
    scope.setFingerprint(["crealy-storage-error", operation]);
    Sentry.captureException(error);
  });
}
