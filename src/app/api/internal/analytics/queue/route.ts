import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const requestedDays = Number(url.searchParams.get("days") || 7);
  const requestedStuck = Number(url.searchParams.get("stuckMinutes") || 15);
  const days = Number.isInteger(requestedDays) ? Math.min(90, Math.max(1, requestedDays)) : 7;
  const stuckMinutes = Number.isInteger(requestedStuck) ? Math.min(120, Math.max(5, requestedStuck)) : 15;
  const to = new Date();
  const { data, error } = await createAdminClient().rpc("queue_stage_analytics_internal", {
    p_from: new Date(to.getTime() - days * 86_400_000).toISOString(),
    p_to: to.toISOString(),
    p_stuck_minutes: stuckMinutes,
  });
  if (error) return NextResponse.json({ error: "queue_analytics_unavailable" }, { status: 503 });
  return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
}
