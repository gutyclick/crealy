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

test("Google and Discord OAuth are gated and cannot bypass private beta", () => {
  const actions = readFileSync("src/app/(auth)/actions.ts", "utf8");
  const signup = readFileSync("src/components/auth/signup-form.tsx", "utf8");
  const callback = readFileSync(
    "src/app/(auth)/auth/callback/route.ts",
    "utf8",
  );
  const buttons = readFileSync(
    "src/components/auth/social-auth-buttons.tsx",
    "utf8",
  );
  assert.match(actions, /signInWithOAuth/);
  assert.match(actions, /NEXT_PUBLIC_GOOGLE_AUTH_ENABLED/);
  assert.match(actions, /NEXT_PUBLIC_DISCORD_AUTH_ENABLED/);
  assert.match(actions, /launch\.inviteRequired/);
  assert.match(callback, /isNewOAuthAccount/);
  assert.match(callback, /social_signup_restricted/);
  assert.match(callback, /deleteUser/);
  assert.match(signup, /inviteCode/);
  assert.match(buttons, /inviteRequired/);
  assert.match(buttons, /signInWithGoogle/);
  assert.match(buttons, /signInWithDiscord/);
});

test("checkout requires and preserves express digital supply consent", () => {
  const checkout = readFileSync("src/app/api/billing/checkout/route.ts", "utf8");
  const button = readFileSync("src/components/billing/checkout-button.tsx", "utf8");
  const migration = readFileSync(
    "supabase/migrations/20260810010000_add_checkout_consents.sql",
    "utf8",
  );
  const webhook = readFileSync(
    "src/lib/stripe/webhooks/process-stripe-event.ts",
    "utf8",
  );
  assert.match(button, /digitalSupplyConsent: true/);
  assert.match(button, /type="checkbox"/);
  assert.match(checkout, /body\.digitalSupplyConsent !== true/);
  assert.match(checkout, /consent_collection: \{ terms_of_service: "required" \}/);
  assert.match(migration, /create table if not exists public\.checkout_consents/);
  assert.match(migration, /accepted boolean not null check \(accepted\)/);
  assert.match(webhook, /checkout_consent_mismatch/);
});

test("legal policies identify the operator and disclose product data flows", () => {
  const legal = readFileSync("src/config/legal.ts", "utf8");
  const privacy = readFileSync("src/app/privacy/page.tsx", "utf8");
  const terms = readFileSync("src/app/terms/page.tsx", "utf8");
  const refund = readFileSync("src/app/refund-policy/page.tsx", "utf8");
  assert.match(legal, /YellowCat Enterprises LLC/);
  assert.match(legal, /Nuevo México/);
  assert.match(privacy, /OpenAI/);
  assert.match(privacy, /prompts/);
  assert.match(privacy, /no utiliza actualmente el contenido de los usuarios para entrenar/);
  assert.match(terms, /al menos 16 años/);
  assert.match(refund, /7 días/);
  assert.match(refund, /máximo 10 créditos/);
});
