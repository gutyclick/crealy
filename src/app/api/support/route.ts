import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { queueTransactionalEmail } from "@/lib/email/queue-email";
import { getLaunchConfig } from "@/lib/launch/server";
import { readLimitedBody } from "@/lib/http/read-limited-body";
import { enforceRateLimit } from "@/lib/operations/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const categories = new Set([
  "technical",
  "billing",
  "account_security",
  "generation_editing",
  "suggestion",
  "other",
]);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!getLaunchConfig().supportEnabled) {
    return NextResponse.json({ error: "support_disabled" }, { status: 503 });
  }
  const hourlyLimit = Math.min(
    20,
    Math.max(1, Number(process.env.SUPPORT_REQUESTS_PER_HOUR || 5)),
  );
  const rateLimit = await enforceRateLimit({
    request,
    action: "support.create",
    ipPolicy: { limit: hourlyLimit, windowSeconds: 3600 },
  }).catch(() => null);
  if (!rateLimit) {
    return NextResponse.json({ error: "support_unavailable" }, { status: 503 });
  }
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
    );
  }

  const boundedBody = await readLimitedBody(request, 24_000);
  if (!boundedBody) {
    return NextResponse.json({ error: "request_too_large" }, { status: 413 });
  }
  const form = await new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: boundedBody,
  }).formData();
  if (String(form.get("website") || "").trim()) {
    return NextResponse.json({ received: true, reference: "CREALY-RECIBIDO" });
  }
  const category = String(form.get("category") || "");
  const subject = String(form.get("subject") || "").trim();
  const message = String(form.get("message") || "").trim();
  const operationId = String(form.get("operationId") || "").trim();
  const submittedEmail = String(form.get("email") || "").trim().toLowerCase();
  if (
    !categories.has(category) ||
    subject.length < 4 ||
    subject.length > 120 ||
    message.length < 20 ||
    message.length > 4000 ||
    /[<>]/.test(subject + message) ||
    /javascript\s*:/i.test(message) ||
    (operationId && !uuidPattern.test(operationId))
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const requesterEmail = user?.email?.toLowerCase() || submittedEmail;
  if (
    !requesterEmail ||
    requesterEmail.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail)
  ) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (operationId) {
    if (!user?.id) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    const { data: ownedJob } = await admin
      .from("jobs")
      .select("id")
      .eq("id", operationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!ownedJob) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
  }
  const { data: supportRequest, error } = await admin
    .from("support_requests")
    .insert({
      user_id: user?.id || null,
      category,
      subject,
      message,
      related_reference_type: operationId ? "job" : null,
      related_reference_id: operationId || null,
      requester_email: requesterEmail,
      requester_email_hash: createHash("sha256")
        .update(requesterEmail)
        .digest("hex"),
    })
    .select("id")
    .single();
  if (error || !supportRequest) {
    return NextResponse.json({ error: "save_failed" }, { status: 503 });
  }
  const reference = `CR-${supportRequest.id.slice(0, 8).toUpperCase()}`;
  await queueTransactionalEmail({
    type: "support_internal",
    audience: "support",
    idempotencyKey: `support-internal:${supportRequest.id}`,
    data: { supportRequestId: supportRequest.id, reference },
  }).catch(() => null);
  if (user?.id) {
    await queueTransactionalEmail({
      userId: user.id,
      type: "support_received",
      idempotencyKey: `support-received:${supportRequest.id}`,
      data: { reference },
    }).catch(() => null);
  }
  return NextResponse.json({ reference }, { status: 201 });
}
