import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { getSafeRedirect } from "../src/lib/auth/redirects";
import {
  parseOAuthReturn,
  serializeOAuthReturn,
} from "../src/lib/auth/oauth-return";

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

test("preserves onboarding as a safe OAuth destination", () => {
  assert.equal(getSafeRedirect("/onboarding", "/dashboard"), "/onboarding");
  assert.deepEqual(
    parseOAuthReturn(serializeOAuthReturn("signup", "/onboarding")),
    { flow: "signup", destination: "/onboarding" },
  );
  assert.deepEqual(
    parseOAuthReturn(serializeOAuthReturn("login", "/dashboard")),
    { flow: "login", destination: "/dashboard" },
  );
  assert.equal(parseOAuthReturn("invalid|https%3A%2F%2Fevil.example"), null);
});

test("recovers an OAuth callback that Supabase sends to the public Site URL", () => {
  const actions = readFileSync("src/app/(auth)/actions.ts", "utf8");
  const callback = readFileSync("src/app/(auth)/auth/callback/route.ts", "utf8");
  const proxy = readFileSync("src/proxy.ts", "utf8");

  assert.match(actions, /serializeOAuthReturn\(oauthFlow, destination\)/);
  assert.match(callback, /savedReturn\?\.destination/);
  assert.match(proxy, /pathname === "\/"/);
  assert.match(proxy, /new URL\("\/auth\/callback", request\.url\)/);
});

test("OAuth callbacks use the canonical production origin instead of a drifting apex domain", () => {
  const actions = readFileSync("src/app/(auth)/actions.ts", "utf8");
  const origin = readFileSync("src/lib/auth/request-origin.ts", "utf8");

  assert.match(actions, /getAuthCallbackUrl\(destination, oauthFlow\)/);
  assert.match(origin, /getCanonicalSiteUrl/);
  assert.match(origin, /process\.env\.NODE_ENV === "production"/);
  assert.match(origin, /canonicalVariants/);
  assert.match(origin, /allowedHosts\.has\(candidate\.hostname\)/);
});

test("canonical redirects never intercept API callbacks or webhooks", () => {
  const proxy = readFileSync("src/proxy.ts", "utf8");
  const config = readFileSync("next.config.ts", "utf8");

  assert.match(proxy, /pathname\.startsWith\("\/api\/"\)/);
  assert.match(proxy, /canonicalBrowserRedirect/);
  assert.doesNotMatch(config, /source: "\/:path\*"/);
});

test("OAuth provider failures return to the originating auth flow", () => {
  const callback = readFileSync("src/app/(auth)/auth/callback/route.ts", "utf8");
  const signup = readFileSync("src/app/(auth)/signup/page.tsx", "utf8");
  const login = readFileSync("src/app/(auth)/login/page.tsx", "utf8");

  assert.match(callback, /oauthFlow === "signup" \? "\/signup" : "\/login"/);
  assert.match(callback, /providerError === "access_denied"/);
  assert.match(callback, /error_code/);
  assert.match(signup, /oauth_cancelled/);
  assert.match(signup, /oauth_provider/);
  assert.match(login, /oauth_cancelled/);
  assert.match(login, /oauth_provider/);
});
