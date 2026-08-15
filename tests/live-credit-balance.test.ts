import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("generation responses return the authoritative post-reservation balance", () => {
  const route = read("src/app/api/generations/route.ts");
  const jobs = read("src/types/jobs.ts");

  assert.match(route, /from\("credit_accounts"\)/);
  assert.match(route, /select\("available_balance"\)/);
  assert.match(route, /availableCredits:\s*creditAccountResult\.data\?\.available_balance/);
  assert.match(jobs, /availableCredits:\s*number \| null/);
});

test("creation flows publish balance changes immediately", () => {
  for (const path of [
    "src/components/generation/generation-form.tsx",
    "src/components/recreate/recreate-form.tsx",
    "src/components/generation/thumbnail-followup-actions.tsx",
  ]) {
    const source = read(path);
    assert.match(source, /publishCreditBalance\(payload\.availableCredits\)/);
  }

  const header = read("src/components/dashboard/dashboard-header.tsx");
  assert.match(header, /useCreditBalance\(credits\)/);
  assert.match(header, /currentCredits/);
  assert.match(header, /CREDIT_BALANCE_REFRESH_EVENT/);
  assert.match(header, /fetch\("\/api\/billing\/status"/);
});

test("terminal jobs reconcile released credits", () => {
  const notifications = read(
    "src/components/dashboard/creation-notification-center.tsx",
  );
  assert.match(
    notifications,
    /newlyReady\.length \|\| newlyFailed\.length[\s\S]{0,120}requestCreditBalanceRefresh\(\)/,
  );
});
