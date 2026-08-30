"use server";

import { createClient } from "@/lib/supabase/server";

export async function acknowledgeAnnouncement(announcementId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };
  const { data, error } = await supabase.rpc("acknowledge_user_announcement", {
    p_announcement_id: announcementId,
  });
  return { ok: !error && data === true };
}
