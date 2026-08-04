"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { getUserBillingState } from "@/lib/billing/get-user-billing-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCreatedAssetRetentionDays } from "@/lib/storage/retention-policy";
import { getStorageQuotaBytes } from "@/config/storage-plans";

export async function pinAsset(formData: FormData) {
  const user = await requireUser("/settings/storage");
  const assetId = String(formData.get("assetId") ?? "");
  const admin = createAdminClient();
  const [billing, assetResult, usageResult] = await Promise.all([
    getUserBillingState(user.id),
    admin
      .from("assets")
      .select("id, file_size_bytes, pinned_at")
      .eq("user_id", user.id)
      .eq("id", assetId)
      .eq("status", "active")
      .maybeSingle(),
    admin.rpc("get_storage_usage_internal", { p_user_id: user.id }),
  ]);
  const asset = assetResult.data;
  if (!asset || asset.pinned_at || assetResult.error || usageResult.error) return;
  const pinnedBytes = Number(usageResult.data?.[0]?.pinned_bytes ?? 0);
  if (pinnedBytes + asset.file_size_bytes > getStorageQuotaBytes(billing.effectivePlan.key)) return;
  await admin
    .from("assets")
    .update({ pinned_at: new Date().toISOString(), expires_at: null })
    .eq("id", assetId)
    .eq("user_id", user.id)
    .eq("status", "active");
  revalidatePath("/settings/storage");
}

export async function unpinAsset(formData: FormData) {
  const user = await requireUser("/settings/storage");
  const assetId = String(formData.get("assetId") ?? "");
  const billing = await getUserBillingState(user.id);
  const expiresAt = new Date(
    Date.now() + getCreatedAssetRetentionDays(billing.effectivePlan.key) * 86_400_000,
  ).toISOString();
  await createAdminClient()
    .from("assets")
    .update({ pinned_at: null, expires_at: expiresAt })
    .eq("id", assetId)
    .eq("user_id", user.id)
    .eq("status", "active");
  revalidatePath("/settings/storage");
}

export async function expireAsset(formData: FormData) {
  const user = await requireUser("/settings/storage");
  const assetId = String(formData.get("assetId") ?? "");
  await createAdminClient()
    .from("assets")
    .update({
      pinned_at: null,
      status: "expired",
      expires_at: new Date().toISOString(),
    })
    .eq("id", assetId)
    .eq("user_id", user.id)
    .eq("status", "active");
  revalidatePath("/settings/storage");
}
