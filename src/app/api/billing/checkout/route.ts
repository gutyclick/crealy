import { NextResponse } from "next/server";

import { BillingError } from "@/lib/billing/billing-errors";
import { getStripePriceId } from "@/lib/billing/get-stripe-price-id";
import { getBillingServerEnv } from "@/lib/env/server";
import { getSiteUrl } from "@/lib/env";
import { getOrCreateStripeCustomer } from "@/lib/stripe/get-or-create-customer";
import { getStripeClient } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function failure(error: unknown) {
  if (error instanceof BillingError) {
    return NextResponse.json(
      { code: error.code, error: error.userMessage },
      { status: error.status },
    );
  }
  console.error("[Crealy Billing]", {
    action: "checkout",
    errorCode: error instanceof Error ? error.message : "unknown",
  });
  return NextResponse.json(
    {
      code: "checkout_creation_failed",
      error: "No pudimos abrir el pago seguro. Inténtalo de nuevo.",
    },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { code: "unauthorized", error: "Inicia sesión para elegir un plan." },
        { status: 401 },
      );
    }

    const config = getBillingServerEnv();
    if (!config.billingEnabled) {
      throw new BillingError(
        "billing_disabled",
        503,
        "Los pagos todavía no están habilitados.",
      );
    }

    let body: { plan?: unknown; clientRequestId?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new BillingError(
        "invalid_plan",
        400,
        "La solicitud de pago no es válida.",
      );
    }
    if (
      (body.plan !== "pro" && body.plan !== "business") ||
      typeof body.clientRequestId !== "string" ||
      !UUID_PATTERN.test(body.clientRequestId)
    ) {
      throw new BillingError(
        "invalid_plan",
        400,
        "Selecciona un plan disponible.",
      );
    }
    if (body.plan === "business" && !config.businessPlanEnabled) {
      throw new BillingError(
        "invalid_plan",
        400,
        "El plan Business todavía no está disponible.",
      );
    }
    if (
      (body.plan === "pro" && !config.proPriceDisplay) ||
      (body.plan === "business" && !config.businessPriceDisplay)
    ) {
      throw new BillingError(
        "billing_disabled",
        503,
        "El precio de este plan todavía no está publicado.",
      );
    }

    const { data: activeSubscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due", "unpaid", "paused"])
      .limit(1)
      .maybeSingle();
    if (activeSubscription) {
      throw new BillingError(
        "subscription_already_exists",
        409,
        "Ya tienes una suscripción. Adminístrala desde Facturación.",
      );
    }

    const priceId = getStripePriceId(body.plan);
    const customerId = await getOrCreateStripeCustomer(user);
    const siteUrl = getSiteUrl();
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: customerId,
        client_reference_id: user.id,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${siteUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
        allow_promotion_codes: false,
        metadata: {
          supabase_user_id: user.id,
          plan_key: body.plan,
        },
        subscription_data: {
          metadata: {
            supabase_user_id: user.id,
            plan_key: body.plan,
          },
        },
      },
      { idempotencyKey: `checkout:${user.id}:${body.clientRequestId}` },
    );
    if (!session.url) {
      throw new BillingError(
        "checkout_creation_failed",
        500,
        "No pudimos abrir el pago seguro. Inténtalo de nuevo.",
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return failure(error);
  }
}
