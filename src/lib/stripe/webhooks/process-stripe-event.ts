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
  await queueTransactionalEmail({
    userId,
    type: "subscription_active",
    idempotencyKey: `subscription-active:${subscriptionId}`,
    data: { plan: synced.planKey },
  }).catch(() => null);
}

async function handleInvoicePaid(
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
  const amount =
    synced.planKey === "pro"
      ? credits.proMonthlyCredits
      : credits.businessMonthlyCredits;
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
        status = await handleInvoicePaid(
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
