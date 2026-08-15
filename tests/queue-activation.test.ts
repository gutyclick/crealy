import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  ONBOARDING_OBJECTIVES,
  getOnboardingObjective,
  onboardingCreateRoute,
} from "../src/config/onboarding";

test("queue telemetry measures every production stage and protects raw spans", () => {
  const migration = readFileSync(
    "supabase/migrations/20260815040000_add_queue_stage_and_activation_analytics.sql",
    "utf8",
  );
  for (const stage of [
    "waiting",
    "preparation",
    "generation",
    "evaluation",
    "correction",
    "processing_storage",
  ]) {
    assert.match(migration, new RegExp(`'${stage}'`));
  }
  assert.match(migration, /percentile_cont\(0\.50\)/);
  assert.match(migration, /percentile_cont\(0\.95\)/);
  assert.match(migration, /stuckCount/);
  assert.match(migration, /alter table public\.job_stage_spans enable row level security/);
  assert.match(migration, /revoke all on table public\.job_stage_spans from public, anon, authenticated/);

  const worker = readFileSync("src/lib/jobs/worker.ts", "utf8");
  for (const hook of ["recordWaitingStage", "preparation", "runJobStage", "processing_storage", "failOpenJobStages"]) {
    assert.match(worker, new RegExp(hook));
  }
});

test("activation analytics follows first download and a mature seven-day return window", () => {
  const migration = readFileSync(
    "supabase/migrations/20260815040000_add_queue_stage_and_activation_analytics.sql",
    "utf8",
  );
  for (const metric of [
    "firstResultDownloadedUsers",
    "firstDownloadActivationRate",
    "medianHoursToFirstDownload",
    "returnEligibleUsers",
    "returnedWithin7Days",
    "sevenDayReturnRate",
  ]) {
    assert.match(migration, new RegExp(metric));
  }
  assert.match(migration, /downloaded_at < p_to - interval '7 days'/);
  assert.match(migration, /activity_date > \(fd\.downloaded_at at time zone 'utc'\)::date/);
});

test("onboarding objectives open a real preconfigured creation", () => {
  assert.equal(ONBOARDING_OBJECTIVES.length, 4);
  for (const objective of ONBOARDING_OBJECTIVES) {
    assert.equal(getOnboardingObjective(objective.id), objective);
    const route = onboardingCreateRoute(objective);
    assert.match(route, /^\/create\?type=/);
    assert.match(route, new RegExp(`onboarding=${objective.id}`));
    assert.ok(objective.descriptionSeed.length > 20);
  }

  const form = readFileSync("src/components/generation/generation-form.tsx", "utf8");
  assert.match(form, /initialOnboardingObjective\?\.descriptionSeed/);
  assert.match(form, /initialOnboardingObjective\?\.recommendedStyle/);
});

test("internal queue and activation reports require the cron secret", () => {
  for (const route of [
    "src/app/api/internal/analytics/queue/route.ts",
    "src/app/api/internal/analytics/activation/route.ts",
  ]) {
    const source = readFileSync(route, "utf8");
    assert.match(source, /CRON_SECRET/);
    assert.match(source, /timingSafeEqual/);
    assert.match(source, /private, no-store/);
  }
});

test("visual signature activation only accepts completed generations owned by the user", () => {
  const source = readFileSync("src/app/api/activation/route.ts", "utf8");
  assert.match(source, /\.eq\("user_id", user\.id\)/);
  assert.match(source, /\.eq\("status", "completed"\)/);
  assert.match(source, /generation_not_found/);
});
