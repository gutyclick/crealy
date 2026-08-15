import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { logger } from "@/lib/observability/logger";
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
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const requestedDays = Number(url.searchParams.get("days") || 30);
  const days = Number.isInteger(requestedDays)
    ? Math.min(365, Math.max(1, requestedDays))
    : 30;
  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  const { data, error } = await createAdminClient().rpc("product_analytics_internal", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) {
    logger.error("analytics.product_report_failed", {
      errorCode: error.code,
    });
    return NextResponse.json({ error: "analytics_unavailable" }, { status: 503 });
  }
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
