import assert from "node:assert/strict";
import test from "node:test";

import { isManageableSubscriptionStatus } from "../src/lib/billing/subscription-status";

test("an unpaid checkout never becomes a manageable subscription", () => {
  assert.equal(isManageableSubscriptionStatus(undefined), false);
  assert.equal(isManageableSubscriptionStatus("incomplete"), false);
  assert.equal(isManageableSubscriptionStatus("incomplete_expired"), false);
  assert.equal(isManageableSubscriptionStatus("canceled"), false);
});

test("confirmed or recoverable subscriptions remain manageable", () => {
  for (const status of ["active", "trialing", "past_due", "unpaid", "paused"]) {
    assert.equal(isManageableSubscriptionStatus(status), true);
  }
});
