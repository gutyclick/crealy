import "server-only";

import { calculateProviderCost, type ProviderTokenUsage } from "@/lib/analytics/provider-cost";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type GenerationEventType =
  | "created"
  | "started"
  | "completed"
  | "failed"
  | "retry_scheduled"
  | "repeated_after_failure"
  | "evaluation_completed"
  | "evaluation_failed"
  | "automatic_correction_requested"
  | "automatic_correction_completed"
  | "automatic_correction_failed"
  | "downloaded"
  | "approved"
  | "rejected"
  | "correction_requested"
  | "abandoned";

export async function recordGenerationEvent(input: {
  generationId: string;
  userId: string;
  jobId?: string | null;
  type: GenerationEventType;
  idempotencyKey: string;
  properties?: Record<string, unknown>;
  durationMs?: number | null;
}) {
  const { error } = await createAdminClient().rpc("record_generation_event_internal", {
    p_generation_id: input.generationId,
    p_user_id: input.userId,
    p_job_id: input.jobId ?? null,
    p_event_type: input.type,
    p_idempotency_key: input.idempotencyKey,
    p_properties: JSON.parse(JSON.stringify(input.properties ?? {})) as Json,
    p_duration_ms: input.durationMs ?? null,
  });
  if (error) throw error;
}

export async function recordProviderCost(input: {
  jobId: string;
  generationId: string;
  userId: string;
  attemptNo: number;
  idempotencyKey: string;
  operation: string;
  model: string;
  providerRequestId?: string | null;
  usage?: ProviderTokenUsage | null;
  estimatedCostUsd?: number | null;
  durationMs: number;
  succeeded: boolean;
  errorCode?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const cost = input.usage ? calculateProviderCost(input.model, input.usage) : null;
  const usage = input.usage;
  const { error } = await createAdminClient().rpc("record_provider_cost_internal", {
    p_job_id: input.jobId,
    p_generation_id: input.generationId,
    p_user_id: input.userId,
    p_attempt_no: input.attemptNo,
    p_idempotency_key: input.idempotencyKey,
    p_operation: input.operation,
    p_provider: "openai",
    p_model: input.model,
    p_provider_request_id: input.providerRequestId ?? null,
    p_input_text_tokens: usage?.inputTextTokens ?? 0,
    p_input_image_tokens: usage?.inputImageTokens ?? 0,
    p_cached_input_tokens: usage?.cachedInputTokens ?? 0,
    p_output_text_tokens: usage?.outputTextTokens ?? 0,
    p_output_image_tokens: usage?.outputImageTokens ?? 0,
    p_total_tokens: usage?.totalTokens ?? 0,
    p_actual_cost_usd: cost?.actualCostUsd ?? null,
    p_estimated_cost_usd: input.estimatedCostUsd ?? null,
    p_cost_source: cost?.costSource ?? "estimated",
    p_pricing_version: cost?.pricingVersion ?? "2026-08-15",
    p_duration_ms: input.durationMs,
    p_succeeded: input.succeeded,
    p_error_code: input.errorCode ?? null,
    p_metadata: JSON.parse(JSON.stringify({
      ...input.metadata,
      cacheWriteTokens: usage?.cacheWriteTokens ?? 0,
    })) as Json,
  });
  if (error) throw error;
}
