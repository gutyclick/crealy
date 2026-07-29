import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("publish_job_outbox_internal", {
    p_limit: 100,
  });
  if (error) {
    return NextResponse.json({ error: "Publisher unavailable" }, { status: 503 });
  }
  return NextResponse.json({ published: data ?? 0 });
}
