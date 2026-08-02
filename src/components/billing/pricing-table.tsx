import { PricingTableClient } from "@/components/billing/pricing-table-client";
import { getBillingServerEnv } from "@/lib/env/server";
import type { PlanKey } from "@/types/billing";

export function PricingTable({ authenticated, currentPlan, compact = false }: { authenticated: boolean; currentPlan?: PlanKey; compact?: boolean }) {
  const billing = getBillingServerEnv();
  return <PricingTableClient authenticated={authenticated} currentPlan={currentPlan} compact={compact} billingEnabled={billing.billingEnabled} availablePrices={billing.priceIds} />;
}
