import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("administrative Pro access stays separate from Stripe", () => {
  const migration = readFileSync(
    "supabase/migrations/20260804010000_add_admin_plan_overrides.sql",
    "utf8",
  );
  const billing = readFileSync(
    "src/lib/billing/get-user-billing-state.ts",
    "utf8",
  );
  assert.match(migration, /create table if not exists public\.plan_overrides/);
  assert.match(billing, /from\("plan_overrides"\)/);
  assert.doesNotMatch(migration, /stripe_subscription_id/);
});

test("the free-tier deployment has an explicit external queue consumer", () => {
  const workflow = readFileSync(".github/workflows/job-consumer.yml", "utf8");
  const vercel = readFileSync("vercel.json", "utf8");
  assert.match(workflow, /cron: "\*\/5 \* \* \* \*"/);
  assert.match(workflow, /x-crealy-cron-secret: \$CRON_SECRET/);
  assert.match(vercel, /"schedule": "0 0 \* \* \*"/);
});

test("Google OAuth is implemented behind an explicit launch flag", () => {
  const actions = readFileSync("src/app/(auth)/actions.ts", "utf8");
  const signup = readFileSync("src/components/auth/signup-form.tsx", "utf8");
  assert.match(actions, /signInWithOAuth/);
  assert.match(actions, /NEXT_PUBLIC_GOOGLE_AUTH_ENABLED/);
  assert.match(signup, /googleEnabled && !inviteRequired/);
});
