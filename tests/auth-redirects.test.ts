import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { getSafeRedirect } from "../src/lib/auth/redirects";

test("preserves a valid pricing intent through registration", () => {
  assert.equal(
    getSafeRedirect("/pricing?plan=creator&period=annual", "/dashboard"),
    "/pricing?plan=creator&period=annual",
  );
});

test("rejects manipulated pricing and external redirects", () => {
  assert.equal(
    getSafeRedirect("/pricing?plan=business&period=annual", "/dashboard"),
    "/dashboard",
  );
  assert.equal(
    getSafeRedirect("https://example.com/pricing", "/dashboard"),
    "/dashboard",
  );
});

test("preserves only exact authenticated settings destinations", () => {
  assert.equal(getSafeRedirect("/settings/billing", "/dashboard"), "/settings/billing");
  assert.equal(getSafeRedirect("/settings/account", "/dashboard"), "/settings/account");
  assert.equal(getSafeRedirect("/settings/billing/evil", "/dashboard"), "/dashboard");
});

test("OAuth callbacks use the validated request origin instead of a drifting apex domain", () => {
  const actions = readFileSync("src/app/(auth)/actions.ts", "utf8");
  const origin = readFileSync("src/lib/auth/request-origin.ts", "utf8");

  assert.match(actions, /getAuthCallbackUrl\(destination, oauthFlow\)/);
  assert.match(origin, /x-forwarded-host/);
  assert.match(origin, /canonicalVariants/);
  assert.match(origin, /candidate\.protocol === "https:"/);
});
