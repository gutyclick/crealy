import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const checkoutButton = readFileSync(
  "src/components/billing/checkout-button.tsx",
  "utf8",
);

test("checkout consent remains mounted while Stripe opens", () => {
  assert.match(checkoutButton, /createPortal/);
  assert.match(checkoutButton, /document\.body/);
  assert.match(checkoutButton, /\}, \[consentOpen\]\);/);
  assert.doesNotMatch(checkoutButton, /\[consentOpen, loading\]/);
});

test("checkout consent prevents concurrent Stripe sessions", () => {
  assert.match(checkoutButton, /checkoutStartedRef\.current/);
  assert.match(
    checkoutButton,
    /!consentAccepted \|\| loadingRef\.current \|\| checkoutStartedRef\.current/,
  );
  assert.match(checkoutButton, /if \(loadingRef\.current\) return;/);
});

test("checkout backdrop closes only from a completed click on the backdrop", () => {
  assert.match(checkoutButton, /onClick=\{\(event\) =>/);
  assert.doesNotMatch(checkoutButton, /onMouseDown=/);
});
