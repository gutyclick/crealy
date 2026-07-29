"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { getUserBillingState } from "@/lib/billing/get-user-billing-state";
import { createAdminClient } from "@/lib/supabase/admin";

function retentionDays(plan: string) {
  return Number(
    plan === "free"
      ? process.env.FREE_ASSET_RETENTION_DAYS || 30
      : process.env.PRO_ASSET_RETENTION_DAYS || 90,
  );
}

export async function pinAsset(formData: FormData) {
  const user = await requireUser("/settings/storage");
  const assetId = String(formData.get("assetId") ?? "");
  const [billing, assets] = await Promise.all([
    getUserBillingState(user.id),
    createAdminClient()
      .from("assets")
      .select("id, file_size_bytes, pinned_at")
      .eq("user_id", user.id)
      .eq("status", "active"),
  ]);
  const asset = assets.data?.find((item) => item.id === assetId);
  if (!asset || assets.error) return;
  const limitMb = Number(
    billing.effectivePlan.key === "free"
      ? process.env.FREE_STORAGE_LIMIT_MB || 250
      : process.env.PRO_STORAGE_LIMIT_MB || 2048,
  );
  const pinnedBytes = (assets.data ?? [])
    .filter((item) => item.pinned_at)
    .reduce((sum, item) => sum + item.file_size_bytes, 0);
  if (pinnedBytes + asset.file_size_bytes > limitMb * 1024 * 1024) return;
  await createAdminClient()
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
    Date.now() + retentionDays(billing.effectivePlan.key) * 86_400_000,
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
