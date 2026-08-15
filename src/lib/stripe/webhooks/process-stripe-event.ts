import "server-only";

import type Stripe from "stripe";

import { getCreditServerEnv } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getInvoiceSubscriptionId,
  syncStripeSubscription,
} from "@/lib/stripe/sync-subscription";
import { queueTransactionalEmail } from "@/lib/email/queue-email";

function objectId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  eventCreated: number,
) {
  const userId = session.metadata?.supabase_user_id;
  const customerId = objectId(session.customer);
  const subscriptionId = objectId(session.subscription);
  if (
    !userId ||
    session.client_reference_id !== userId ||
    !customerId ||
    !subscriptionId
  ) {
    throw new Error("checkout_relationship_invalid");
  }

  const admin = createAdminClient();
  const { data: customer } = await admin
    .from("billing_customers")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (!customer || customer.user_id !== userId) {
    throw new Error("checkout_customer_mismatch");
  }
  const synced = await syncStripeSubscription(subscriptionId, eventCreated);
  const consentId = session.metadata?.checkout_consent_id;
  let consentAcceptedAt = "";
  if (consentId) {
    if (session.consent?.terms_of_service !== "accepted") {
      throw new Error("stripe_terms_consent_missing");
    }
    const completedAt = new Date(eventCreated * 1000).toISOString();
    const { data: consent, error: consentError } = await admin
      .from("checkout_consents")
      .update({ completed_at: completedAt, stripe_checkout_session_id: session.id })
      .eq("id", consentId)
      .eq("user_id", userId)
      .select("accepted_at")
      .maybeSingle();
    if (consentError || !consent) throw new Error("checkout_consent_mismatch");
    consentAcceptedAt = consent.accepted_at;
  }
  await queueTransactionalEmail({
    userId,
    type: "subscription_active",
    idempotencyKey: `subscription-active:${subscriptionId}`,
    data: {
      plan: synced.planKey,
      period: session.metadata?.billing_period || "",
      consentAcceptedAt,
    },
  }).catch(() => null);
}

export async function syncPaidInvoice(
  invoice: Stripe.Invoice,
  eventCreated: number,
) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return "ignored" as const;

  const synced = await syncStripeSubscription(
    subscriptionId,
    eventCreated,
  );
  if (!["active", "trialing"].includes(synced.subscription.status)) {
    return "ignored" as const;
  }

  const credits = getCreditServerEnv();
  const amount = synced.planKey === "starter"
    ? credits.starterMonthlyCredits
    : synced.planKey === "pro"
      ? credits.creatorMonthlyCredits
      : credits.proMonthlyCredits;
  const admin = createAdminClient();
  const { error } = await admin.rpc(
    "grant_subscription_credits_internal",
    {
      p_user_id: synced.userId,
      p_invoice_id: invoice.id,
      p_amount: amount,
      p_expires_at: synced.periodEnd,
      p_plan_key: synced.planKey,
    },
  );
  if (error) throw new Error("credit_grant_failed");

  const currency = invoice.currency.toLowerCase();
  const grossAmountMinor = Math.max(0, invoice.amount_paid);
  const { error: revenueError } = await admin
    .from("billing_revenue_events")
    .upsert(
      {
        user_id: synced.userId,
        stripe_invoice_id: invoice.id,
        plan_key: synced.planKey,
        currency,
        gross_amount_minor: grossAmountMinor,
        credits_granted: amount,
        gross_revenue_per_credit_usd:
          currency === "usd" ? grossAmountMinor / 100 / amount : null,
        paid_at: new Date((invoice.status_transitions.paid_at ?? eventCreated) * 1000).toISOString(),
      },
      { onConflict: "stripe_invoice_id" },
    );
  if (revenueError) throw new Error("billing_revenue_record_failed");

  await admin
    .from("subscriptions")
    .update({ last_invoice_paid_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId);
  return "processed" as const;
}

async function claimEvent(event: Stripe.Event) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_stripe_event_internal", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_api_version: event.api_version,
    p_livemode: event.livemode,
  });
  if (error) throw new Error("stripe_event_claim_failed");
  return data;
}

async function finishEvent(
  eventId: string,
  status: "processed" | "ignored" | "failed",
  errorCode: string | null,
) {
  const admin = createAdminClient();
  await admin.rpc("finish_stripe_event_internal", {
    p_event_id: eventId,
    p_status: status,
    p_error_code: errorCode,
  });
}

export async function processStripeEvent(event: Stripe.Event) {
  const claim = await claimEvent(event);
  if (claim === "duplicate") return { duplicate: true };

  const startedAt = Date.now();
  try {
    let status: "processed" | "ignored" = "processed";
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
          event.created,
        );
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncStripeSubscription(subscription.id, event.created);
        break;
      }
      case "invoice.paid":
        status = await syncPaidInvoice(
          event.data.object as Stripe.Invoice,
          event.created,
        );
        break;
      case "invoice.payment_failed":
      case "invoice.payment_action_required": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        if (subscriptionId) {
          const synced = await syncStripeSubscription(subscriptionId, event.created);
          await queueTransactionalEmail({
            userId: synced.userId,
            type: "payment_failed",
            idempotencyKey: `payment-failed:${invoice.id}`,
          }).catch(() => null);
        } else {
          status = "ignored";
        }
        break;
      }
      case "checkout.session.expired":
        status = "ignored";
        break;
      default:
        status = "ignored";
    }

    await finishEvent(event.id, status, null);
    console.info("[Crealy Stripe]", {
      eventId: event.id,
      eventType: event.type,
      status,
      durationMs: Date.now() - startedAt,
    });
    return { duplicate: false };
  } catch (error) {
    const errorCode =
      error instanceof Error ? error.message.slice(0, 120) : "unknown";
    await finishEvent(event.id, "failed", errorCode);
    console.error("[Crealy Stripe]", {
      eventId: event.id,
      eventType: event.type,
      status: "failed",
      errorCode,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}
