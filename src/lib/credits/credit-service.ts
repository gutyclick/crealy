import "server-only";

import { getCreditServerEnv } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CreditConsumptionResult,
  CreditReservationResult,
} from "@/types/billing";

export class CreditError extends Error {
  constructor(
    public readonly code:
      | "insufficient_credits"
      | "credit_reservation_failed"
      | "credit_consumption_failed"
      | "credit_release_failed",
  ) {
    super(code);
  }
}

export async function ensureWelcomeCredits(userId: string) {
  const config = getCreditServerEnv();
  const admin = createAdminClient();

  const { error: settingsError } = await admin.rpc(
    "sync_credit_settings_internal",
    {
      p_free_signup_credits: config.freeSignupCredits,
      p_pro_monthly_credits: config.proMonthlyCredits,
      p_business_monthly_credits: config.businessMonthlyCredits,
    },
  );
  if (settingsError) throw new Error("credit_settings_sync_failed");

  if (config.freeSignupCredits === 0) return;
  const { error } = await admin.rpc("grant_credits_internal", {
    p_user_id: userId,
    p_source_type: "signup_bonus",
    p_source_reference: `signup:${userId}`,
    p_amount: config.freeSignupCredits,
    p_expires_at: null,
    p_description: "Créditos de bienvenida",
  });
  if (error) throw new Error("signup_credit_grant_failed");
}

export async function reserveCredits({
  userId,
  amount,
  referenceType,
  referenceId,
}: {
  userId: string;
  amount: number;
  referenceType: "generation" | "edit";
  referenceId: string;
}): Promise<CreditReservationResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("reserve_credits_internal", {
    p_user_id: userId,
    p_amount: amount,
    p_reference_type: referenceType,
    p_reference_id: referenceId,
    p_idempotency_key: `${referenceType}:${referenceId}`,
  });

  if (error || !data?.[0]) {
    throw new CreditError(
      error?.message.includes("insufficient_credits")
        ? "insufficient_credits"
        : "credit_reservation_failed",
    );
  }

  return {
    reservationId: data[0].reservation_id,
    amount: data[0].reserved_amount,
    creditsRemaining: data[0].credits_remaining,
    isExisting: data[0].is_existing,
  };
}

export async function releaseCredits(userId: string, reservationId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc(
    "release_reserved_credits_internal",
    {
      p_user_id: userId,
      p_reservation_id: reservationId,
    },
  );
  if (error) throw new CreditError("credit_release_failed");
  return data;
}

export async function completeGenerationWithCredits({
  userId,
  generationId,
  reservationId,
  storagePath,
  mimeType,
  width,
  height,
  model,
  providerRequestId,
}: {
  userId: string;
  generationId: string;
  reservationId: string;
  storagePath: string;
  mimeType: string;
  width: number;
  height: number;
  model: string;
  providerRequestId: string | null;
}): Promise<CreditConsumptionResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc(
    "complete_generation_with_credits_internal",
    {
      p_user_id: userId,
      p_generation_id: generationId,
      p_reservation_id: reservationId,
      p_storage_path: storagePath,
      p_mime_type: mimeType,
      p_width: width,
      p_height: height,
      p_model: model,
      p_provider_request_id: providerRequestId,
    },
  );
  if (error || !data?.[0]) {
    throw new CreditError("credit_consumption_failed");
  }
  return {
    transactionId: data[0].credit_transaction_id,
    amount: data[0].credits_used,
    creditsRemaining: data[0].credits_remaining,
  };
}

export async function completeEditWithCredits({
  userId,
  versionId,
  reservationId,
  storagePath,
  mimeType,
  width,
  height,
  model,
  providerResponseId,
}: {
  userId: string;
  versionId: string;
  reservationId: string;
  storagePath: string;
  mimeType: string;
  width: number;
  height: number;
  model: string;
  providerResponseId: string;
}): Promise<CreditConsumptionResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc(
    "complete_edit_version_with_credits_internal",
    {
      p_user_id: userId,
      p_version_id: versionId,
      p_reservation_id: reservationId,
      p_storage_path: storagePath,
      p_mime_type: mimeType,
      p_width: width,
      p_height: height,
      p_model: model,
      p_provider_response_id: providerResponseId,
    },
  );
  if (error || !data?.[0]) {
    throw new CreditError("credit_consumption_failed");
  }
  return {
    transactionId: data[0].credit_transaction_id,
    amount: data[0].credits_used,
    creditsRemaining: data[0].credits_remaining,
  };
}
