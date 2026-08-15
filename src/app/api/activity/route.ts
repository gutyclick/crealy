import { NextResponse } from "next/server";

import { recordUserActivity } from "@/lib/analytics/activation";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await recordUserActivity(user.id).catch(() => null);
  return NextResponse.json({ recorded: true });
}
