import assert from "node:assert/strict";
import test from "node:test";

import { classifyJobError } from "../src/lib/jobs/retry-policy";

test("network failures are retried with bounded exponential delay", () => {
  const first = classifyJobError(new Error("fetch failed"), 1);
  const later = classifyJobError(new Error("ETIMEDOUT"), 9);
  assert.equal(first.retryable, true);
  assert.equal(first.delaySeconds, 5);
  assert.equal(later.delaySeconds, 120);
});

test("invalid domain failures are definitive", () => {
  const result = classifyJobError(new Error("invalid_source_image"), 1);
  assert.equal(result.retryable, false);
  assert.equal(result.errorCode, "invalid_source_image");
});

test("provider permission failures are explicit and are not retried", () => {
  const result = classifyJobError(
    new Error(
      "401 You have insufficient permissions. Missing scopes: api.responses.write",
    ),
    1,
  );
  assert.equal(result.retryable, false);
  assert.equal(result.errorCode, "provider_permissions");
  assert.equal(result.delaySeconds, 0);
});

test("mapped generation provider failures preserve retry semantics", () => {
  const result = classifyJobError(
    Object.assign(new Error("Servicio ocupado"), {
      code: "provider_rate_limit",
    }),
    2,
  );
  assert.equal(result.retryable, true);
  assert.equal(result.errorCode, "provider_rate_limit");
  assert.equal(result.delaySeconds, 10);
});

test("database errors preserve their real message and classify oversized prompts", () => {
  const result = classifyJobError(
    {
      code: "23514",
      message:
        'new row violates check constraint "generations_enhanced_prompt_length"',
    },
    1,
  );
  assert.equal(result.retryable, false);
  assert.equal(result.errorCode, "generation_prompt_too_long");
});

test("non-Error provider-shaped failures are not collapsed to unknown", () => {
  const result = classifyJobError(
    { code: "provider_rejected", message: "provider rejected request" },
    1,
  );
  assert.equal(result.errorCode, "provider_rejected_request");
});
