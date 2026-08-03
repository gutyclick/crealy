import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("scripts use a request nonce and never allow unsafe-inline", () => {
  const proxy = readFileSync("src/proxy.ts", "utf8");
  const config = readFileSync("next.config.ts", "utf8");
  assert.match(proxy, /script-src[^\n]+nonce-/);
  assert.doesNotMatch(`${proxy}\n${config}`, /script-src[^\n]+unsafe-inline/);
});

test("the complete dashboard route group has a server authentication boundary", () => {
  const layout = readFileSync("src/app/(dashboard)/layout.tsx", "utf8");
  assert.match(layout, /await requireUser\(\)/);
});

test("the operations monitor is cron-secret protected", () => {
  const route = readFileSync("src/app/api/internal/operations/monitor/route.ts", "utf8");
  assert.match(route, /CRON_SECRET/);
  assert.match(route, /Bearer \$\{secret\}/);
});
