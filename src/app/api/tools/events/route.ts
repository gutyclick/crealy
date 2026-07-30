import { NextResponse } from "next/server";

import { tools } from "@/config/tools";
import { logger } from "@/lib/observability/logger";
import { enforceRateLimit, getToolRateLimits } from "@/lib/operations/rate-limit";

const allowedPaths = new Set(["/tools", ...tools.map((tool) => tool.href)]);
const allowedEvents = new Set(["view", "upload"]);

export async function POST(request: Request) {
  try {
    const limited = await enforceRateLimit({
      request,
      action: "tools.analytics",
      ipPolicy: getToolRateLimits().publicIp,
    });
    if (!limited.allowed) return new NextResponse(null, { status: 429 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return new NextResponse(null, { status: 415 });
  }
  try {
    const body = (await request.json()) as { event?: string; path?: string };
    if (
      !body.event ||
      !allowedEvents.has(body.event) ||
      !body.path ||
      !allowedPaths.has(body.path)
    ) {
      return NextResponse.json({ error: "invalid_event" }, { status: 400 });
    }
    logger.info(`tool.${body.event}`, {
      tool: body.path === "/tools" ? "hub" : body.path.split("/").at(-1),
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
}
