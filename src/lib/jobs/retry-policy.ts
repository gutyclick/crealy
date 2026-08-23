import OpenAI from "openai";

export type RetryDecision = {
  retryable: boolean;
  errorCode: string;
  delaySeconds: number;
};

export function classifyJobError(
  error: unknown,
  attempt: number,
): RetryDecision {
  const exponentialDelay = Math.min(120, 5 * 2 ** Math.max(0, attempt - 1));
  const structuralCode =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : null;
  if (
    structuralCode === "provider_rate_limit" ||
    structuralCode === "provider_timeout" ||
    structuralCode === "provider_unavailable"
  ) {
    return {
      retryable: true,
      errorCode: structuralCode,
      delaySeconds: exponentialDelay,
    };
  }
  if (
    structuralCode === "provider_safety_rejection" ||
    structuralCode === "moderation_blocked"
  ) {
    return {
      retryable: false,
      errorCode: "moderation_blocked",
      delaySeconds: 0,
    };
  }
  if (error instanceof OpenAI.APIError) {
    const code = String(error.code || "provider_error");
    if (error.status === 429) {
      return { retryable: true, errorCode: "provider_rate_limit", delaySeconds: exponentialDelay };
    }
    if (error.status && error.status >= 500) {
      return { retryable: true, errorCode: "provider_unavailable", delaySeconds: exponentialDelay };
    }
    if (code === "moderation_blocked") {
      return { retryable: false, errorCode: "moderation_blocked", delaySeconds: 0 };
    }
    return { retryable: false, errorCode: code.slice(0, 80), delaySeconds: 0 };
  }

  const message = error instanceof Error ? error.message : "unknown_error";
  if (
    /insufficient permissions/i.test(message) ||
    /missing scopes?/i.test(message) ||
    /api\.responses\.write/i.test(message)
  ) {
    return {
      retryable: false,
      errorCode: "provider_permissions",
      delaySeconds: 0,
    };
  }
  if (
    message.includes("fetch failed") ||
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("storage_upload_failed")
  ) {
    return { retryable: true, errorCode: "transient_infrastructure", delaySeconds: exponentialDelay };
  }
  return {
    retryable: false,
    errorCode: message.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "job_failed",
    delaySeconds: 0,
  };
}
