import "server-only";

import type { User } from "@supabase/supabase-js";

import { BillingError } from "@/lib/billing/billing-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";

export async function getOrCreateStripeCustomer(user: User) {
  const admin = createAdminClient();
  const { data: existing, error: lookupError } = await admin
    .from("billing_customers")
    .select("stripe_customer_id, livemode")
    .eq("user_id", user.id)
    .maybeSingle();
  if (lookupError) {
    throw new BillingError(
      "checkout_creation_failed",
      500,
      "No pudimos iniciar el proceso de pago.",
    );
  }
  if (existing) return existing.stripe_customer_id;

  const stripe = getStripeClient();
  const customer = await stripe.customers.create(
    {
      email: user.email,
      metadata: { supabase_user_id: user.id },
    },
    { idempotencyKey: `customer:${user.id}` },
  );

  const { error: insertError } = await admin.from("billing_customers").insert({
    user_id: user.id,
    stripe_customer_id: customer.id,
    livemode: customer.livemode,
  });
  if (!insertError) return customer.id;

  const { data: winner } = await admin
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (winner) return winner.stripe_customer_id;

  throw new BillingError(
    "checkout_creation_failed",
    500,
    "No pudimos iniciar el proceso de pago.",
  );
}
