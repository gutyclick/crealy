import { NextResponse } from "next/server";

import { checkImageProvider } from "@/lib/generation/check-image-provider";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/operations/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function deepCheckAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

function response(status: "ready" | "degraded", httpStatus: number, details?: Record<string, unknown>) {
  return NextResponse.json(
    { status, ...(details ? { checks: details } : {}) },
    { status: httpStatus, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: Request) {
  const deep = new URL(request.url).searchParams.get("deep") === "1";
  if (deep && !deepCheckAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limited = await enforceRateLimit({
      request,
      action: "system.readiness",
      ipPolicy: RATE_LIMITS.readinessIp,
    });
    if (!limited.allowed) {
      return NextResponse.json(
        { status: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter), "Cache-Control": "no-store" } },
      );
    }
  } catch {
    return response("degraded", 503);
  }

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "OPENAI_API_KEY",
    "CRON_SECRET",
  ];
  const environmentReady = required.every((name) => process.env[name]?.trim()) &&
    Boolean(process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  if (!environmentReady) return response("degraded", 503, deep ? { environment: false } : undefined);

  try {
    const { error } = await createAdminClient().from("jobs").select("id").limit(1);
    if (error) throw error;
    const imageProvider = await checkImageProvider({ force: deep });
    const ready = imageProvider.ok;
    return response(
      ready ? "ready" : "degraded",
      ready ? 200 : 503,
      deep ? { environment: true, database: true, imageProvider: ready, providerCode: imageProvider.code } : undefined,
    );
  } catch {
    return response("degraded", 503, deep ? { environment: true, database: false, imageProvider: false } : undefined);
  }
}
