import { PricingTableClient } from "@/components/billing/pricing-table-client";
import { getBillingServerEnv } from "@/lib/env/server";
import type { PlanKey } from "@/types/billing";
import type { BillingPeriod } from "@/config/plans";

export function PricingTable({ authenticated, currentPlan, compact = false, initialPeriod = "monthly" }: { authenticated: boolean; currentPlan?: PlanKey; compact?: boolean; initialPeriod?: BillingPeriod }) {
  const billing = getBillingServerEnv();
  return <PricingTableClient authenticated={authenticated} currentPlan={currentPlan} compact={compact} initialPeriod={initialPeriod} billingEnabled={billing.billingEnabled} availablePrices={billing.priceIds} />;
}
