import "server-only";

import type { BillingPeriod, PublicPlanId } from "@/config/plans";
import { getBillingServerEnv } from "@/lib/env/server";
import type { PlanKey } from "@/types/billing";

export type PaidPublicPlan = Exclude<PublicPlanId, "free">;

export function internalPlanKey(plan: PaidPublicPlan): Exclude<PlanKey, "free"> {
  return plan === "starter" ? "starter" : plan === "creator" ? "pro" : "business";
}

export function publicPlanId(plan: Exclude<PlanKey, "free">): PaidPublicPlan {
  return plan === "starter" ? "starter" : plan === "pro" ? "creator" : "pro";
}

export function getStripePriceId(plan: PaidPublicPlan, period: BillingPeriod) {
  const priceId = getBillingServerEnv().priceIds[plan][period];
  if (!priceId) throw new Error("missing_price");
  return priceId;
}

export function getPlanKeyFromStripePrice(priceId: string | null | undefined): Exclude<PlanKey, "free"> | null {
  if (!priceId) return null;
  const entries = Object.entries(getBillingServerEnv().priceIds) as [PaidPublicPlan, { monthly: string; annual: string }][];
  const match = entries.find(([, prices]) => prices.monthly === priceId || prices.annual === priceId);
  return match ? internalPlanKey(match[0]) : null;
}
