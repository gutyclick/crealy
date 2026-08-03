import { NextResponse } from "next/server";

import { getResendClient } from "@/lib/email/client";
import { logger } from "@/lib/observability/logger";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!webhookSecret || !id || !timestamp || !signature) {
    logger.warn("webhook.resend_signature_rejected", { errorCode: "missing_signature" });
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const rawBody = await request.text();
  let event;
  try {
    event = getResendClient().webhooks.verify({
      payload: rawBody,
      headers: { id, timestamp, signature },
      webhookSecret,
    });
  } catch {
    logger.warn("webhook.resend_signature_rejected", { errorCode: "invalid_signature" });
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  if (!event.type.startsWith("email.")) {
    return NextResponse.json({ received: true });
  }
  const providerMessageId = "email_id" in event.data ? event.data.email_id : null;
  if (!providerMessageId) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();
  const { data: delivery } = await admin
    .from("email_deliveries")
    .select("id, user_id, status")
    .eq("provider_message_id", providerMessageId)
    .maybeSingle();
  if (!delivery) return NextResponse.json({ received: true });

  const now = new Date().toISOString();
  if (event.type === "email.delivered") {
    await admin
      .from("email_deliveries")
      .update({ status: "delivered", delivered_at: now, last_error_code: null })
      .eq("id", delivery.id);
  } else if (event.type === "email.bounced") {
    await admin
      .from("email_deliveries")
      .update({ status: "bounced", bounced_at: now, last_error_code: "bounced" })
      .eq("id", delivery.id);
  } else if (event.type === "email.complained") {
    await admin
      .from("email_deliveries")
      .update({
        status: "complained",
        complained_at: now,
        last_error_code: "complained",
      })
      .eq("id", delivery.id);
  } else if (event.type === "email.failed" || event.type === "email.suppressed") {
    await admin
      .from("email_deliveries")
      .update({
        status: event.type === "email.suppressed" ? "suppressed" : "failed",
        last_error_code:
          event.type === "email.suppressed" ? "suppressed" : "provider_failed",
      })
      .eq("id", delivery.id);
  }

  if (
    delivery.user_id &&
    ["email.bounced", "email.complained", "email.suppressed"].includes(event.type)
  ) {
    await admin.from("notification_preferences").upsert({
      user_id: delivery.user_id,
      deliverability_blocked_at: now,
    });
  }
  logger.info("email.webhook_processed", {
    deliveryId: delivery.id,
    eventType: event.type,
  });
  return NextResponse.json({ received: true });
}
