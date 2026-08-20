import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync(
  new URL(
    "../supabase/migrations/20260729030000_add_durable_jobs_and_operations.sql",
    import.meta.url,
  ),
  "utf8",
).toLowerCase();

const referencePositionFix = readFileSync(
  new URL(
    "../supabase/migrations/20260731010000_fix_generation_reference_positions.sql",
    import.meta.url,
  ),
  "utf8",
).toLowerCase();

const generationQueueMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260801010000_allow_generation_queue.sql",
    import.meta.url,
  ),
  "utf8",
).toLowerCase();

const expandedRecreateReferences = readFileSync(
  new URL(
    "../supabase/migrations/20260815010000_expand_recreate_element_references.sql",
    import.meta.url,
  ),
  "utf8",
).toLowerCase();

const generationProductLimitsMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260820010000_remove_generation_product_limits.sql",
    import.meta.url,
  ),
  "utf8",
).toLowerCase();

test("job creation is atomic with credit reservation and outbox", () => {
  assert.match(sql, /create_generation_job_internal/);
  assert.match(sql, /create_edit_job_internal/);
  assert.match(sql, /reserve_credits_internal/);
  assert.match(sql, /insert into public\.job_outbox/);
  assert.match(sql, /unique \(user_id, idempotency_key\)/);
});

test("claims are concurrency safe and recoverable", () => {
  assert.match(sql, /for update skip locked/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /visibility_expires_at/);
  assert.match(sql, /recover_stuck_jobs_internal/);
});

test("financial completion and definitive failure are database atomic", () => {
  assert.match(sql, /complete_generation_with_credits_internal/);
  assert.match(sql, /complete_edit_version_with_credits_internal/);
  assert.match(sql, /release_reserved_credits_internal/);
});

test("generation references start at one and Recreate can persist five images", () => {
  assert.match(referencePositionFix, /reference_position integer := 1;/);
  assert.match(referencePositionFix, /pg_get_functiondef/);
  assert.match(expandedRecreateReferences, /position between 1 and 5/);
  assert.match(expandedRecreateReferences, /> 5/);
});

test("generation queue accepts several jobs while preserving a per-user cap", () => {
  assert.match(generationQueueMigration, /generation_queue_limit/);
  assert.match(generationQueueMigration, />= 4/);
  assert.match(generationQueueMigration, /job_type = 'generation'/);
});

test("generation usage is governed by credits instead of daily product limits", () => {
  assert.match(generationProductLimitsMigration, /generation_daily_limit_not_removed/);
  assert.match(generationProductLimitsMigration, /execute corrected_definition/);
  assert.match(generationProductLimitsMigration, /daily_count >= p_daily_limit/);
});
