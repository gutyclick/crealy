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
