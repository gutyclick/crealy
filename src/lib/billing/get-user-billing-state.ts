import "server-only";

import { getBillingServerEnv } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlan } from "@/lib/billing/get-effective-plan";
import type {
  SubscriptionStatus,
  UserBillingState,
} from "@/types/billing";

export async function getUserBillingState(
  userId: string,
): Promise<UserBillingState> {
  const supabase = await createClient();
  const config = getBillingServerEnv();

  const [subscriptionResult, accountResult, transactionsResult] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan_key, status, current_period_end, cancel_at_period_end, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("credit_accounts")
        .select("available_balance, reserved_balance, lifetime_granted, lifetime_consumed")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("credit_transactions")
        .select("id, transaction_type, amount, balance_after, description, created_at")
        .eq("user_id", userId)
        .in("transaction_type", [
          "grant",
          "consume",
          "expire",
          "refund",
          "adjustment",
        ])
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

  if (
    subscriptionResult.error ||
    accountResult.error ||
    transactionsResult.error
  ) {
    throw new Error("billing_state_unavailable");
  }

  const subscription = subscriptionResult.data;
  const effectivePlan = getEffectivePlan(
    subscription,
    config.gracePeriodDays,
  );

  let hasBillingCustomer = Boolean(subscription);
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("billing_customers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    hasBillingCustomer = Boolean(data);
  } catch {
    // The billing page remains readable if privileged configuration is absent.
  }

  return {
    effectivePlan,
    subscription: subscription
      ? {
          status: subscription.status as SubscriptionStatus,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: subscription.current_period_end,
        }
      : null,
    credits: {
      available: accountResult.data?.available_balance ?? 0,
      reserved: accountResult.data?.reserved_balance ?? 0,
      lifetimeGranted: accountResult.data?.lifetime_granted ?? 0,
      lifetimeConsumed: accountResult.data?.lifetime_consumed ?? 0,
    },
    recentTransactions: (transactionsResult.data ?? []).map((item) => ({
      id: item.id,
      type: item.transaction_type as UserBillingState["recentTransactions"][number]["type"],
      amount: item.amount,
      balanceAfter: item.balance_after,
      description: item.description,
      createdAt: item.created_at,
    })),
    billingEnabled: config.billingEnabled,
    canCheckoutPro: Boolean(
        config.billingEnabled &&
        config.priceIds.creator.monthly &&
        process.env.STRIPE_SECRET_KEY?.trim(),
    ),
    hasBillingCustomer,
  };
}
