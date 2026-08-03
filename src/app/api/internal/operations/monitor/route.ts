import { NextResponse } from "next/server";

import { inspectOperationalHealth } from "@/lib/observability/operations-monitor";
import { logger } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await inspectOperationalHealth());
  } catch (error) {
    logger.error("operations.monitor_failed", {
      errorCode: error instanceof Error ? error.message.slice(0, 80) : "monitor_unavailable",
    });
    return NextResponse.json({ healthy: false, error: "monitor_unavailable" }, { status: 503 });
  }
}
