import { NextResponse } from "next/server";

import { BillingError } from "@/lib/billing/billing-errors";
import { getSiteUrl } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe/client";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/operations/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { code: "unauthorized", error: "Inicia sesión para administrar tu plan." },
      { status: 401 },
    );
  }

  try {
    const rateLimit = await enforceRateLimit({
      request,
      userId: user.id,
      action: "billing.portal",
      userPolicy: RATE_LIMITS.billingUser,
      ipPolicy: RATE_LIMITS.billingIp,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { code: "rate_limited", error: "Espera un momento antes de intentarlo otra vez." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
      );
    }

    const { data: customer, error } = await createAdminClient()
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !customer) {
      throw new BillingError(
        "billing_customer_missing",
        404,
        "Aún no tienes una cuenta de facturación para administrar.",
      );
    }

    const session = await getStripeClient().billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${getSiteUrl()}/settings/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const mapped =
      error instanceof BillingError
        ? error
        : new BillingError(
            "portal_creation_failed",
            500,
            "No pudimos abrir el portal de facturación.",
          );
    return NextResponse.json(
      { code: mapped.code, error: mapped.userMessage },
      { status: mapped.status },
    );
  }
}
