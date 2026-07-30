import { NextResponse } from "next/server";

import { enforceRateLimit } from "@/lib/operations/rate-limit";
import { readLimitedBody } from "@/lib/http/read-limited-body";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const categories = new Set(["broken", "suggestion", "poor_result", "other"]);

export async function POST(request: Request) {
  if (process.env.PRODUCT_FEEDBACK_ENABLED === "false") {
    return NextResponse.json({ error: "feedback_disabled" }, { status: 503 });
  }
  const limited = await enforceRateLimit({
    request,
    action: "feedback.create",
    ipPolicy: { limit: 10, windowSeconds: 3600 },
  }).catch(() => null);
  if (!limited) {
    return NextResponse.json({ error: "feedback_unavailable" }, { status: 503 });
  }
  if (!limited.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const boundedBody = await readLimitedBody(request, 12_000);
  if (!boundedBody) {
    return NextResponse.json({ error: "request_too_large" }, { status: 413 });
  }
  const body = (await new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: boundedBody,
  }).json().catch(() => null)) as {
    category?: unknown;
    message?: unknown;
    pagePath?: unknown;
    consentToShareContent?: unknown;
  } | null;
  const category = typeof body?.category === "string" ? body.category : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const pagePath =
    typeof body?.pagePath === "string" &&
    body.pagePath.startsWith("/") &&
    body.pagePath.length <= 240
      ? body.pagePath
      : null;
  if (
    !categories.has(category) ||
    message.length < 10 ||
    message.length > 2000 ||
    /[<>]/.test(message)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await createAdminClient().from("product_feedback").insert({
    user_id: user?.id || null,
    category,
    message,
    page_path: pagePath,
    consent_to_share_content: body?.consentToShareContent === true,
  });
  if (error) {
    return NextResponse.json({ error: "save_failed" }, { status: 503 });
  }
  return NextResponse.json({ received: true }, { status: 201 });
}
