import { NextResponse } from "next/server";

import type { BillingPeriod } from "@/config/plans";
import { BillingError } from "@/lib/billing/billing-errors";
import { getStripePriceId, internalPlanKey, type PaidPublicPlan } from "@/lib/billing/get-stripe-price-id";
import { getSiteUrl } from "@/lib/env";
import { getBillingServerEnv } from "@/lib/env/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/operations/rate-limit";
import { getOrCreateStripeCustomer } from "@/lib/stripe/get-or-create-customer";
import { getStripeClient } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { getAal2ApiAccess } from "@/lib/auth/mfa-assurance";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CURRENT_DIGITAL_SUPPLY_CONSENT_VERSION,
  CURRENT_REFUND_POLICY_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/config/legal";

export const runtime = "nodejs";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function failure(error: unknown) {
  if (error instanceof BillingError) return NextResponse.json({ code: error.code, error: error.userMessage }, { status: error.status });
  console.error("[Crealy Billing]", { action: "checkout", errorCode: error instanceof Error ? error.message : "unknown" });
  return NextResponse.json({ code: "checkout_creation_failed", error: "No pudimos abrir el pago seguro. Inténtalo de nuevo." }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ code: "unauthorized", error: "Inicia sesión para elegir un plan." }, { status: 401 });
    const aal2 = await getAal2ApiAccess();
    if (!aal2.ok) return NextResponse.json({ code: aal2.code, error: "Confirma tu identidad antes de administrar la facturación.", challengeUrl: aal2.challengeUrl }, { status: aal2.status });
    if (!user.email_confirmed_at) return NextResponse.json({ code: "email_unverified", error: "Confirma tu correo antes de elegir un plan." }, { status: 403 });
    const rateLimit = await enforceRateLimit({ request, userId: user.id, action: "billing.checkout", userPolicy: RATE_LIMITS.billingUser, ipPolicy: RATE_LIMITS.billingIp });
    if (!rateLimit.allowed) return NextResponse.json({ code: "rate_limited", error: "Espera un momento antes de intentarlo otra vez." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
    const config = getBillingServerEnv(); if (!config.billingEnabled) throw new BillingError("billing_disabled", 503, "Los pagos todavía no están habilitados.");
    const body = await request.json().catch(() => null) as { plan?: unknown; period?: unknown; clientRequestId?: unknown; digitalSupplyConsent?: unknown } | null;
    if (!body || (body.plan !== "starter" && body.plan !== "creator" && body.plan !== "pro") || (body.period !== "monthly" && body.period !== "annual") || typeof body.clientRequestId !== "string" || !UUID_PATTERN.test(body.clientRequestId)) throw new BillingError("invalid_plan", 400, "Selecciona un plan disponible.");
    if (body.digitalSupplyConsent !== true) throw new BillingError("consent_required", 400, "Confirma el inicio inmediato del servicio digital para continuar.");
    const publicPlan = body.plan as PaidPublicPlan; const period = body.period as BillingPeriod;
    if (!config.priceIds[publicPlan][period]) throw new BillingError("billing_disabled", 503, "Este periodo todavía no está disponible para el plan seleccionado.");
    const { data: activeSubscription } = await supabase.from("subscriptions").select("id").eq("user_id", user.id).in("status", ["active", "trialing", "past_due", "unpaid", "paused"]).limit(1).maybeSingle();
    if (activeSubscription) throw new BillingError("subscription_already_exists", 409, "Ya tienes una suscripción. Adminístrala desde Facturación.");
    const planKey = internalPlanKey(publicPlan); const customerId = await getOrCreateStripeCustomer(user); const siteUrl = getSiteUrl();
    const admin = createAdminClient();
    const { data: consent, error: consentError } = await admin
      .from("checkout_consents")
      .upsert({
        user_id: user.id,
        client_request_id: body.clientRequestId,
        public_plan: publicPlan,
        billing_period: period,
        consent_version: CURRENT_DIGITAL_SUPPLY_CONSENT_VERSION,
        terms_version: CURRENT_TERMS_VERSION,
        refund_policy_version: CURRENT_REFUND_POLICY_VERSION,
        accepted: true,
      }, { onConflict: "user_id,client_request_id" })
      .select("id, accepted_at")
      .single();
    if (consentError || !consent) throw new BillingError("checkout_creation_failed", 503, "No pudimos registrar tu consentimiento. Inténtalo de nuevo.");
    const sharedMetadata = {
      supabase_user_id: user.id,
      plan_key: planKey,
      public_plan: publicPlan,
      billing_period: period,
      checkout_consent_id: consent.id,
      digital_supply_consent_version: CURRENT_DIGITAL_SUPPLY_CONSENT_VERSION,
    };
    const session = await getStripeClient().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: getStripePriceId(publicPlan, period), quantity: 1 }],
      success_url: `${siteUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
      allow_promotion_codes: false,
      consent_collection: { terms_of_service: "required" },
      custom_text: {
        submit: {
          message: "Al confirmar, solicitas la activación inmediata del servicio digital. Se aplican los Términos y la Política de reembolsos de Crealy, sin limitar tus derechos obligatorios como consumidor.",
        },
      },
      metadata: sharedMetadata,
      subscription_data: { metadata: sharedMetadata },
    }, { idempotencyKey: `checkout:${user.id}:${body.clientRequestId}` });
    if (!session.url) throw new BillingError("checkout_creation_failed", 500, "No pudimos abrir el pago seguro. Inténtalo de nuevo.");
    await admin.from("checkout_consents").update({ stripe_checkout_session_id: session.id }).eq("id", consent.id);
    return NextResponse.json({ url: session.url });
  } catch (error) { return failure(error); }
}
