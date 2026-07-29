import "server-only";

import { getBillingServerEnv } from "@/lib/env/server";
import type { PlanKey } from "@/types/billing";

export function getStripePriceId(plan: Exclude<PlanKey, "free">) {
  const config = getBillingServerEnv();

  if (plan === "pro") {
    if (!config.proPriceId) throw new Error("missing_pro_price");
    return config.proPriceId;
  }

  if (!config.businessPlanEnabled || !config.businessPriceId) {
    throw new Error("business_plan_disabled");
  }
  return config.businessPriceId;
}

export function getPlanKeyFromStripePrice(
  priceId: string | null | undefined,
): Exclude<PlanKey, "free"> | null {
  if (!priceId) return null;
  const config = getBillingServerEnv();
  if (priceId === config.proPriceId) return "pro";
  if (
    config.businessPlanEnabled &&
    config.businessPriceId &&
    priceId === config.businessPriceId
  ) {
    return "business";
  }
  return null;
}
