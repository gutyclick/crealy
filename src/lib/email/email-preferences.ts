import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TransactionalEmailType } from "@/lib/email/templates";

const preferenceColumn: Partial<Record<TransactionalEmailType, string>> = {
  generation_ready: "generation_ready",
  edit_ready: "edit_ready",
  asset_expiring: "asset_expiring",
  low_credits: "low_credits",
  subscription_active: "billing_updates",
  payment_failed: "billing_updates",
};

export async function canSendOptionalEmail(
  userId: string,
  type: TransactionalEmailType,
) {
  const column = preferenceColumn[type];
  if (!column) return true;
  const { data } = await createAdminClient()
    .from("notification_preferences")
    .select(
      "generation_ready, edit_ready, asset_expiring, low_credits, billing_updates, deliverability_blocked_at",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (data?.deliverability_blocked_at) return false;
  if (!data) return type === "asset_expiring" || type === "low_credits" || type === "payment_failed";
  return Boolean(data[column as keyof typeof data]);
}

