import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  calculateProviderCost,
  parseImageUsage,
  parseResponseUsage,
} from "../src/lib/analytics/provider-cost";

test("calculates GPT Image 2 cost from provider token usage", () => {
  const usage = parseImageUsage({
    input_tokens: 3_000,
    input_tokens_details: { text_tokens: 1_000, image_tokens: 2_000 },
    output_tokens: 3_000,
    total_tokens: 6_000,
  });
  assert.ok(usage);
  const cost = calculateProviderCost("gpt-image-2", usage);
  assert.equal(cost.actualCostUsd, 0.111);
  assert.equal(cost.costSource, "calculated_from_usage");
  assert.equal(cost.pricingVersion, "2026-08-15");
});

test("calculates response-model cost and separates cached tokens", () => {
  const usage = parseResponseUsage({
    input_tokens: 1_000,
    input_tokens_details: { cached_tokens: 200, cache_write_tokens: 0 },
    output_tokens: 500,
    total_tokens: 1_500,
  });
  assert.ok(usage);
  assert.equal(calculateProviderCost("gpt-5.6-luna", usage).actualCostUsd, 0.000764);
});

test("quality and profitability analytics stay private and complete", () => {
  const migration = readFileSync(
    "supabase/migrations/20260815030000_add_product_quality_and_cost_analytics.sql",
    "utf8",
  );
  for (const signal of [
    "approvalRate",
    "downloadRate",
    "correctionRequestRate",
    "repeatedAfterFailure",
    "subjectsOmittedOrDuplicated",
    "incorrectText",
    "averageHoursToFirstDownload",
    "totalCostUsd",
    "grossMarginUsd",
    "creditsCharged",
  ]) {
    assert.match(migration, new RegExp(signal));
  }
  assert.match(migration, /alter table public\.generation_events enable row level security/);
  assert.match(migration, /revoke all on table public\.provider_cost_events from public, anon, authenticated/);
  assert.match(migration, /record_generation_abandonments_internal/);

  const profitabilityMigration = readFileSync(
    "supabase/migrations/20260815031000_include_failed_jobs_in_product_profitability.sql",
    "utf8",
  );
  assert.match(profitabilityMigration, /'failedResults'/);
  assert.match(profitabilityMigration, /sum\(total_cost_usd\)/);
  assert.match(
    profitabilityMigration,
    /sum\(credit_cost\) filter \(where status = 'completed'\)/,
  );
  assert.match(
    profitabilityMigration,
    /recognized_revenue_usd - total_cost_usd/,
  );

  const route = readFileSync("src/app/api/internal/analytics/product/route.ts", "utf8");
  assert.match(route, /CRON_SECRET/);
  assert.match(route, /timingSafeEqual/);
  assert.doesNotMatch(route, /model:/);
});

test("worker records retries, evaluations, corrections and every provider call", () => {
  const worker = readFileSync("src/lib/jobs/worker.ts", "utf8");
  for (const event of [
    'type: "retry_scheduled"',
    'type: "evaluation_completed"',
    'type: "automatic_correction_requested"',
    'type: "automatic_correction_completed"',
    'type: "failed"',
    "recordProviderCost",
  ]) {
    assert.match(worker, new RegExp(event.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
