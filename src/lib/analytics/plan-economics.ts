import "server-only";

import { PRICING_PLANS, type PublicPlanId } from "@/config/plans";
import { publicPlanId } from "@/lib/billing/get-stripe-price-id";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanKey } from "@/types/billing";

function publicPlan(plan: PlanKey): PublicPlanId {
  return plan === "free" ? "free" : publicPlanId(plan);
}

export async function getPlanEconomicsSnapshot(
  userId: string,
  plan: PlanKey,
  creditCost: number,
) {
  const planId = publicPlan(plan);
  const definition = PRICING_PLANS.find((item) => item.id === planId)!;
  let unitRevenueUsd = definition.credits > 0
    ? definition.monthlyPrice / definition.credits
    : 0;
  let revenueSource: "invoice" | "nominal_monthly" | "none" =
    planId === "free" ? "none" : "nominal_monthly";

  if (planId !== "free") {
    const { data } = await createAdminClient()
      .from("billing_revenue_events")
      .select("gross_revenue_per_credit_usd")
      .eq("user_id", userId)
      .not("gross_revenue_per_credit_usd", "is", null)
      .order("paid_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const invoiceRate = Number(data?.gross_revenue_per_credit_usd);
    if (Number.isFinite(invoiceRate) && invoiceRate >= 0) {
      unitRevenueUsd = invoiceRate;
      revenueSource = "invoice";
    }
  }

  return {
    planKeyAtCreation: planId,
    monthlyPlanPriceUsd: definition.monthlyPrice,
    monthlyCreditsAtCreation: definition.credits,
    revenuePerCreditUsd: Math.round(unitRevenueUsd * 1_000_000) / 1_000_000,
    allocatedRevenueUsd:
      Math.round(unitRevenueUsd * creditCost * 1_000_000) / 1_000_000,
    revenueSource,
  };
}
