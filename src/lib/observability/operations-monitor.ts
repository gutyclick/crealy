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

  const [metricsResult, stuckResult, reservationsResult, usageResult, reservedCostResult] = await Promise.all([
    admin.from("operational_metrics").select("metric_name, dimension, metric_value").eq("metric_date", today.toISOString().slice(0, 10)),
    admin.from("jobs").select("id", { count: "exact", head: true }).in("status", ["queued", "claimed", "processing", "retry_scheduled"]).lt("updated_at", stuckBefore),
    admin.from("credit_reservations").select("id", { count: "exact", head: true }).eq("status", "reserved").lt("created_at", reservationBefore),
    admin.from("provider_usage").select("estimated_cost_usd").gte("created_at", today.toISOString()),
    admin.from("jobs").select("estimated_cost_usd").in("status", ["queued", "claimed", "processing", "retry_scheduled"]).gte("created_at", today.toISOString()),
  ]);

  const queryError = [metricsResult.error, stuckResult.error, reservationsResult.error, usageResult.error, reservedCostResult.error].find(Boolean);
  if (queryError) throw queryError;

  const metric = (name: string, dimension: string) => Number(metricsResult.data?.find((row) => row.metric_name === name && row.dimension === dimension)?.metric_value || 0);
  const generationCreated = metric("jobs_created", "generation");
  const generationFailed = metric("jobs_failed", "generation");
  const failureRate = generationCreated ? generationFailed / generationCreated : 0;
  const dailySpend = [...(usageResult.data || []), ...(reservedCostResult.data || [])].reduce((sum, row) => sum + Number(row.estimated_cost_usd || 0), 0);
  const dailyBudget = getOperationsConfig().dailyBudgetUsd;
  const alerts: Alert[] = [];

  const failureThreshold = numericEnv("ALERT_GENERATION_FAILURE_RATE", 0.15);
  if (generationCreated >= numericEnv("ALERT_GENERATION_MIN_SAMPLE", 5) && failureRate >= failureThreshold) alerts.push({ key: "generation_failure_rate", value: failureRate, threshold: failureThreshold, unit: "ratio" });
  if ((stuckResult.count || 0) > 0) alerts.push({ key: "stuck_jobs", value: stuckResult.count || 0, threshold: 0, unit: "jobs" });
  if ((reservationsResult.count || 0) > 0) alerts.push({ key: "open_credit_reservations", value: reservationsResult.count || 0, threshold: 0, unit: "reservations" });
  if (dailyBudget && dailySpend / dailyBudget >= numericEnv("ALERT_DAILY_BUDGET_RATIO", 0.8)) alerts.push({ key: "daily_openai_budget", value: dailySpend, threshold: dailyBudget, unit: "usd" });
  alerts.forEach(emitAlert);

  Sentry.metrics.gauge("crealy.generation.failure_rate", failureRate);
  Sentry.metrics.gauge("crealy.jobs.stuck", stuckResult.count || 0);
  Sentry.metrics.gauge("crealy.credits.open_reservations", reservationsResult.count || 0);
  Sentry.metrics.gauge("crealy.openai.daily_spend_usd", dailySpend);

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
