import { NextResponse } from "next/server";

import { BillingError } from "@/lib/billing/billing-errors";
import { publicPlanId } from "@/lib/billing/get-stripe-price-id";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/operations/rate-limit";
import { reconcileUserBilling } from "@/lib/stripe/reconcile-user-billing";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { code: "unauthorized", error: "Inicia sesión para actualizar tu plan." },
      { status: 401 },
    );
  }

  try {
    const limit = await enforceRateLimit({
      request,
      userId: user.id,
      action: "billing.reconcile",
      userPolicy: RATE_LIMITS.billingUser,
      ipPolicy: RATE_LIMITS.billingIp,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { code: "rate_limited", error: "Espera un momento antes de revisar de nuevo." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfter) },
        },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      sessionId?: unknown;
    };
    const sessionId =
      typeof body.sessionId === "string" &&
      /^cs_(?:test_|live_)?[A-Za-z0-9_]+$/.test(body.sessionId) &&
      body.sessionId.length <= 255
        ? body.sessionId
        : undefined;
    if (body.sessionId !== undefined && !sessionId) {
      return NextResponse.json(
        { code: "invalid_session", error: "La referencia del pago no es válida." },
        { status: 400 },
      );
    }

    const result = await reconcileUserBilling({
      userId: user.id,
      email: user.email,
      sessionId,
    });
    return NextResponse.json({
      ok: true,
      plan: publicPlanId(result.planKey),
      status: result.subscription.status,
    });
  } catch (error) {
    const mapped =
      error instanceof BillingError
        ? error
        : new BillingError(
            "billing_reconciliation_failed",
            500,
            "No pudimos actualizar el plan en este momento.",
          );
    console.error("[Crealy Billing]", {
      action: "reconcile",
      userId: user.id,
      errorCode: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { code: mapped.code, error: mapped.userMessage },
      { status: mapped.status },
    );
  }
}
