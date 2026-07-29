import "server-only";

import type Stripe from "stripe";

import { BillingError } from "@/lib/billing/billing-errors";
import { getPlanKeyFromStripePrice } from "@/lib/billing/get-stripe-price-id";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function timestamp(value: number | null | undefined) {
  return typeof value === "number"
    ? new Date(value * 1000).toISOString()
    : null;
}

function idOf(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

export async function syncStripeSubscription(
  subscriptionId: string,
  eventCreated?: number,
) {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = idOf(subscription.customer);
  if (!customerId) {
    throw new BillingError(
      "subscription_sync_failed",
      500,
      "La información de tu plan todavía se está actualizando.",
    );
  }

  const configuredItem = subscription.items.data.find((item) =>
    Boolean(getPlanKeyFromStripePrice(item.price.id)),
  );
  const planKey = getPlanKeyFromStripePrice(configuredItem?.price.id);
  if (!configuredItem || !planKey) {
    throw new BillingError(
      "subscription_sync_failed",
      500,
      "La información de tu plan todavía se está actualizando.",
    );
  }

  const admin = createAdminClient();
  let { data: billingCustomer } = await admin
    .from("billing_customers")
    .select("user_id, livemode")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!billingCustomer) {
    const metadataUserId = subscription.metadata.supabase_user_id;
    if (!metadataUserId || !UUID_PATTERN.test(metadataUserId)) {
      throw new BillingError(
        "billing_customer_missing",
        500,
        "La información de tu plan todavía se está actualizando.",
      );
    }
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      throw new BillingError(
        "billing_customer_missing",
        500,
        "La información de tu plan todavía se está actualizando.",
      );
    }
    const { error } = await admin.from("billing_customers").upsert(
      {
        user_id: metadataUserId,
        stripe_customer_id: customerId,
        livemode: customer.livemode,
      },
      { onConflict: "user_id" },
    );
    if (error) throw error;
    billingCustomer = {
      user_id: metadataUserId,
      livemode: customer.livemode,
    };
  }

  if (billingCustomer.livemode !== subscription.livemode) {
    throw new BillingError(
      "subscription_sync_failed",
      500,
      "La información de tu plan todavía se está actualizando.",
    );
  }

  const productId = idOf(configuredItem.price.product);
  const eventTime = eventCreated ? timestamp(eventCreated) : null;
  const { error: upsertError } = await admin.from("subscriptions").upsert(
    {
      user_id: billingCustomer.user_id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: configuredItem.price.id,
      stripe_product_id: productId,
      plan_key: planKey,
      status: subscription.status,
      currency: subscription.currency,
      current_period_start: timestamp(configuredItem.current_period_start),
      current_period_end: timestamp(configuredItem.current_period_end),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: timestamp(subscription.canceled_at),
      ended_at: timestamp(subscription.ended_at),
      trial_end: timestamp(subscription.trial_end),
      last_stripe_event_created_at: eventTime,
      livemode: subscription.livemode,
    },
    { onConflict: "stripe_subscription_id" },
  );
  if (upsertError) {
    throw new BillingError(
      "subscription_sync_failed",
      500,
      "La información de tu plan todavía se está actualizando.",
    );
  }

  return {
    subscription,
    userId: billingCustomer.user_id,
    planKey,
    periodEnd: timestamp(configuredItem.current_period_end),
  };
}

export function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const subscription =
    invoice.parent?.subscription_details?.subscription ?? null;
  return typeof subscription === "string" ? subscription : subscription?.id;
}
