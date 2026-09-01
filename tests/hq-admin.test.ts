import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("HQ is a private host-aware route with an administrative allowlist", () => {
  const proxy = read("src/proxy.ts");
  const session = read("src/lib/supabase/proxy.ts");
  const access = read("src/lib/hq/access.ts");

  assert.match(proxy, /HQ_HOST/);
  assert.match(proxy, /destination\.pathname = "\/hq"/);
  assert.match(session, /"\/hq"/);
  assert.match(access, /HQ_ADMIN_EMAILS/);
  assert.match(access, /HQ_ADMIN_USER_IDS/);
  assert.match(access, /requestHost !== configuredHost/);
});

test("HQ requires AAL2 and every data page repeats the server boundary", () => {
  const access = read("src/lib/hq/access.ts");
  const pages = [
    "src/app/(hq)/hq/page.tsx",
    "src/app/(hq)/hq/users/page.tsx",
    "src/app/(hq)/hq/generations/page.tsx",
    "src/app/(hq)/hq/feedback/page.tsx",
    "src/app/(hq)/hq/jobs/page.tsx",
    "src/app/(hq)/hq/billing/page.tsx",
  ];

  assert.match(access, /assurance\.currentLevel !== "aal2"/);
  assert.match(access, /mfa-challenge/);
  for (const page of pages) assert.match(read(page), /await requireHqAdmin\(\)/);
});

test("HQ stays private, read-only and responsive in its first release", () => {
  const layout = read("src/app/(hq)/hq/layout.tsx");
  const styles = read("src/app/globals.css");

  assert.match(layout, /index: false/);
  assert.match(layout, /follow: false/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /\.hq-mobile-nav/);
  assert.doesNotMatch(layout, /createAdminClient/);
});
