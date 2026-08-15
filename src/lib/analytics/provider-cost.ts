export type ProviderTokenUsage = {
  inputTextTokens: number;
  inputImageTokens: number;
  cachedInputTokens: number;
  cacheWriteTokens: number;
  outputTextTokens: number;
  outputImageTokens: number;
  totalTokens: number;
};

export type ProviderCostEstimate = {
  actualCostUsd: number | null;
  costSource: "calculated_from_usage" | "usage_without_pricing";
  pricingVersion: string;
};

export type ProviderCallObservation = {
  operation: string;
  model: string;
  providerRequestId: string | null;
  usage: ProviderTokenUsage | null;
  durationMs: number;
  succeeded: boolean;
  errorCode: string | null;
  metadata?: Record<string, unknown>;
};

export type ProviderUsageObserver = (
  observation: ProviderCallObservation,
) => void | Promise<void>;

// Snapshot of the public OpenAI prices in effect when this instrumentation was added.
// Keeping the version on every row prevents historical margins from changing when prices do.
export const OPENAI_PRICING_VERSION = "2026-08-15";

const PER_MILLION = 1_000_000;

const RESPONSE_MODEL_RATES: Record<
  string,
  { input: number; cachedInput: number; cacheWrite: number; output: number }
> = {
  "gpt-5.6-luna": { input: 0.2, cachedInput: 0.02, cacheWrite: 0.25, output: 1.2 },
};

function money(value: number) {
  return Math.round(value * 1_000_000_000) / 1_000_000_000;
}

export function emptyProviderUsage(): ProviderTokenUsage {
  return {
    inputTextTokens: 0,
    inputImageTokens: 0,
    cachedInputTokens: 0,
    cacheWriteTokens: 0,
    outputTextTokens: 0,
    outputImageTokens: 0,
    totalTokens: 0,
  };
}

export function parseImageUsage(value: unknown): ProviderTokenUsage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const usage = value as Record<string, unknown>;
  const details = usage.input_tokens_details && typeof usage.input_tokens_details === "object"
    ? usage.input_tokens_details as Record<string, unknown>
    : {};
  const outputDetails = usage.output_tokens_details && typeof usage.output_tokens_details === "object"
    ? usage.output_tokens_details as Record<string, unknown>
    : {};
  const inputTextTokens = Number(details.text_tokens || 0);
  const inputImageTokens = Number(details.image_tokens || 0);
  const outputImageTokens = Number(outputDetails.image_tokens ?? usage.output_tokens ?? 0);
  const totalTokens = Number(
    usage.total_tokens || inputTextTokens + inputImageTokens + outputImageTokens,
  );
  if (![inputTextTokens, inputImageTokens, outputImageTokens, totalTokens].every(Number.isFinite)) {
    return null;
  }
  return {
    inputTextTokens,
    inputImageTokens,
    cachedInputTokens: 0,
    cacheWriteTokens: 0,
    outputTextTokens: 0,
    outputImageTokens,
    totalTokens,
  };
}

export function parseResponseUsage(value: unknown): ProviderTokenUsage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const usage = value as Record<string, unknown>;
  const inputDetails = usage.input_tokens_details && typeof usage.input_tokens_details === "object"
    ? usage.input_tokens_details as Record<string, unknown>
    : {};
  const inputTextTokens = Number(usage.input_tokens || 0);
  const cachedInputTokens = Number(inputDetails.cached_tokens || 0);
  const cacheWriteTokens = Number(inputDetails.cache_write_tokens || 0);
  const outputTextTokens = Number(usage.output_tokens || 0);
  const totalTokens = Number(usage.total_tokens || inputTextTokens + outputTextTokens);
  if (![inputTextTokens, cachedInputTokens, cacheWriteTokens, outputTextTokens, totalTokens].every(Number.isFinite)) {
    return null;
  }
  return {
    inputTextTokens,
    inputImageTokens: 0,
    cachedInputTokens,
    cacheWriteTokens,
    outputTextTokens,
    outputImageTokens: 0,
    totalTokens,
  };
}

export function calculateProviderCost(
  model: string,
  usage: ProviderTokenUsage,
): ProviderCostEstimate {
  if (model === "gpt-image-2" || model.startsWith("gpt-image-2-")) {
    return {
      actualCostUsd: money(
        (usage.inputTextTokens * 5
          + usage.inputImageTokens * 8
          + usage.outputImageTokens * 30) / PER_MILLION,
      ),
      costSource: "calculated_from_usage",
      pricingVersion: OPENAI_PRICING_VERSION,
    };
  }
  const rates = RESPONSE_MODEL_RATES[model];
  if (!rates) {
    return {
      actualCostUsd: null,
      costSource: "usage_without_pricing",
      pricingVersion: OPENAI_PRICING_VERSION,
    };
  }
  const regularInput = Math.max(
    0,
    usage.inputTextTokens - usage.cachedInputTokens - usage.cacheWriteTokens,
  );
  return {
    actualCostUsd: money(
      (regularInput * rates.input
        + usage.cachedInputTokens * rates.cachedInput
        + usage.cacheWriteTokens * rates.cacheWrite
        + usage.outputTextTokens * rates.output) / PER_MILLION,
    ),
    costSource: "calculated_from_usage",
    pricingVersion: OPENAI_PRICING_VERSION,
  };
}
