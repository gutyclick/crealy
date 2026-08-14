import "server-only";

import type Stripe from "stripe";

import { BillingError } from "@/lib/billing/billing-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import { syncStripeSubscription } from "@/lib/stripe/sync-subscription";
import { syncPaidInvoice } from "@/lib/stripe/webhooks/process-stripe-event";

function objectId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function isConfirmedSession(session: Stripe.Checkout.Session) {
  return (
    session.status === "complete" &&
    (session.payment_status === "paid" ||
      session.payment_status === "no_payment_required")
  );
}

function belongsToUser(session: Stripe.Checkout.Session, userId: string) {
  return (
    session.client_reference_id === userId &&
    session.metadata?.supabase_user_id === userId
  );
}

async function findRecoverableSession({
  userId,
  email,
}: {
  userId: string;
  email?: string | null;
}) {
  const stripe = getStripeClient();
  const admin = createAdminClient();
  const { data: billingCustomer } = await admin
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  let customerId = billingCustomer?.stripe_customer_id ?? null;
  if (!customerId && email) {
    const customers = await stripe.customers.list({ email, limit: 10 });
    const ownedCustomer = customers.data.find(
      (customer) => customer.metadata.supabase_user_id === userId,
    );
    if (ownedCustomer) {
      customerId = ownedCustomer.id;
      const { error } = await admin.from("billing_customers").upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          livemode: ownedCustomer.livemode,
        },
        { onConflict: "user_id" },
      );
      if (error) throw new Error("billing_customer_recovery_failed");
    }
  }

  if (!customerId) return null;
  const sessions = await stripe.checkout.sessions.list({
    customer: customerId,
    limit: 20,
  });
  return (
    sessions.data.find(
      (session) =>
        belongsToUser(session, userId) &&
        isConfirmedSession(session) &&
        Boolean(objectId(session.subscription)),
    ) ?? null
  );
}

export async function reconcileUserBilling({
  userId,
  email,
  sessionId,
}: {
  userId: string;
  email?: string | null;
  sessionId?: string;
}) {
  const stripe = getStripeClient();
  const session = sessionId
    ? await stripe.checkout.sessions.retrieve(sessionId)
    : await findRecoverableSession({ userId, email });

  if (
    !session ||
    !belongsToUser(session, userId) ||
    !isConfirmedSession(session)
  ) {
    throw new BillingError(
      "billing_confirmation_pending",
      409,
      "Stripe todavía no ha confirmado un pago para esta cuenta.",
    );
  }

  const subscriptionId = objectId(session.subscription);
  if (!subscriptionId) {
    throw new BillingError(
      "billing_confirmation_pending",
      409,
      "Stripe todavía no ha confirmado la suscripción.",
    );
  }

  const synced = await syncStripeSubscription(subscriptionId);
  const latestInvoiceId = objectId(synced.subscription.latest_invoice);
  if (latestInvoiceId) {
    const invoice = await stripe.invoices.retrieve(latestInvoiceId);
    if (invoice.status === "paid") {
      await syncPaidInvoice(invoice, Math.floor(Date.now() / 1000));
    }
  }

  return synced;
}
