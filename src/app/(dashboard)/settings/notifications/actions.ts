"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export async function updateNotificationPreferences(formData: FormData) {
  await requireUser();
  const checked = (name: string) => formData.get(name) === "on";
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_notification_preferences", {
    p_generation_ready: checked("generationReady"),
    p_edit_ready: checked("editReady"),
    p_asset_expiring: checked("assetExpiring"),
    p_low_credits: checked("lowCredits"),
    p_product_updates: checked("productUpdates"),
    p_marketing_emails: checked("marketingEmails"),
  });
  if (error) redirect("/settings/notifications?error=save");
  revalidatePath("/settings/notifications");
  redirect("/settings/notifications?saved=1");
}

