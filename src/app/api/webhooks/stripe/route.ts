import { NextResponse } from "next/server";

import { getStripeClient } from "@/lib/stripe/client";
import { processStripeEvent } from "@/lib/stripe/webhooks/process-stripe-event";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!signature || !secret) {
    return NextResponse.json(
      { error: "webhook_not_configured" },
      { status: 400 },
    );
  }

  let event;
  try {
    const payload = await request.text();
    event = getStripeClient().webhooks.constructEvent(
      payload,
      signature,
      secret,
    );
  } catch {
    return NextResponse.json(
      { error: "invalid_signature" },
      { status: 400 },
    );
  }

  try {
    const result = await processStripeEvent(event);
    return NextResponse.json({ received: true, duplicate: result.duplicate });
  } catch {
    return NextResponse.json(
      { error: "processing_failed" },
      { status: 500 },
    );
  }
}
