import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("public job routes only enqueue or read and never execute the worker", () => {
  const routes = [
    "src/app/api/generations/route.ts",
    "src/app/api/edit-sessions/[sessionId]/versions/route.ts",
    "src/app/api/jobs/[jobId]/route.ts",
  ].map(read).join("\n");
  assert.doesNotMatch(routes, /processQueuedJob/);
  assert.doesNotMatch(routes, /\bafter\s*\(/);
  const consumer = read("src/app/api/internal/jobs/tick/route.ts");
  assert.match(consumer, /processQueuedJob/);
  assert.match(consumer, /ready: true/);
  assert.match(routes, /mark_job_ready_internal/);
});

test("Trigger.dev dispatches durable jobs by id and the cron remains recovery-only", () => {
  const routes = [
    "src/app/api/generations/route.ts",
    "src/app/api/edit-sessions/[sessionId]/versions/route.ts",
  ].map(read).join("\n");
  const dispatcher = read("src/lib/jobs/dispatch-job.ts");
  const task = read("src/trigger/process-crealy-job.ts");
  const workflow = read(".github/workflows/job-consumer.yml");

  assert.match(routes, /dispatchQueuedJob\(queued\.job_id\)/);
  assert.match(dispatcher, /payload: \{ jobId \}/);
  assert.match(dispatcher, /idempotencyKey: `crealy-job:\$\{jobId\}`/);
  assert.match(dispatcher, /recovery-cron/);
  assert.doesNotMatch(dispatcher, /OPENAI_API_KEY|R2_SECRET_ACCESS_KEY|SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(task, /processQueuedJob\(jobId\)/);
  assert.match(task, /result\.status !== "retry_scheduled"/);
  assert.match(task, /await wait\.for\(/);
  assert.match(task, /retryAfterSeconds/);
  assert.match(task, /concurrencyLimit: 3/);
  assert.match(workflow, /cron: "\*\/5 \* \* \* \*"/);
});

test("reserved credits remain visible as in-process instead of looking consumed", () => {
  const statusRoute = read("src/app/api/billing/status/route.ts");
  const dashboardLayout = read("src/app/(dashboard)/layout.tsx");
  const dashboardHeader = read("src/components/dashboard/dashboard-header.tsx");

  assert.match(statusRoute, /reservedCredits: state\.credits\.reserved/);
  assert.match(dashboardLayout, /reservedCredits=\{reservedCredits\}/);
  assert.match(dashboardHeader, /disponibles · \$\{reservedCredits\} en proceso/);
});

test("storage usage is aggregated in SQL rather than from the recent-file list", () => {
  const migration = read("supabase/migrations/20260803010000_add_storage_usage_aggregate.sql");
  const page = read("src/app/(dashboard)/settings/storage/page.tsx");
  assert.match(migration, /sum\(a\.file_size_bytes\)/);
  assert.match(page, /get_storage_usage_internal/);
  assert.doesNotMatch(page, /assets\.filter[^\n]+reduce/);
});

test("the environment exposes one Starter Creator Pro matrix without billing aliases", () => {
  const example = read(".env.example");
  for (const name of ["STARTER_MONTHLY_CREDITS", "CREATOR_MONTHLY_CREDITS", "PRO_MONTHLY_CREDITS"]) assert.match(example, new RegExp(`^${name}=`, "m"));
  for (const legacy of ["STRIPE_BUSINESS_PRICE_ID", "BUSINESS_MONTHLY_CREDITS", "BUSINESS_PLAN_ENABLED", "STRIPE_PRO_PRICE_ID="]) assert.doesNotMatch(example, new RegExp(legacy));
});

test("the job consumer uses the Sharp release supported by Next without a global override", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    dependencies?: Record<string, string>;
    overrides?: Record<string, string>;
  };

  assert.equal(packageJson.dependencies?.sharp, "0.34.5");
  assert.equal(packageJson.overrides?.sharp, undefined);
});
