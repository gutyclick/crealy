import { PricingTable } from "@/components/billing/pricing-table";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUserBillingState } from "@/lib/billing/get-user-billing-state";
import type { PlanKey } from "@/types/billing";

export async function PricingSection() {
  const user = await getCurrentUser(); let currentPlan: PlanKey | undefined;
  if (user) try { currentPlan = (await getUserBillingState(user.id)).effectivePlan.key; } catch { currentPlan = undefined; }
  return <section id="pricing" className="scroll-mt-24 py-24 sm:py-32"><div className="mx-auto mb-12 flex max-w-3xl flex-col items-center px-5 text-center"><h2 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">¿Cuánto quieres crear?</h2><p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">Empieza gratis y mejora tu plan cuando necesites crear más.</p></div><PricingTable authenticated={Boolean(user)} currentPlan={currentPlan}/></section>;
}
