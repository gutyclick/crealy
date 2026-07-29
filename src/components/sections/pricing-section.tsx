import { PricingTable } from "@/components/billing/pricing-table";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUserBillingState } from "@/lib/billing/get-user-billing-state";

export async function PricingSection() {
  const user = await getCurrentUser();
  let currentPlan: "free" | "pro" | "business" | undefined;
  if (user) {
    try {
      currentPlan = (await getUserBillingState(user.id)).effectivePlan.key;
    } catch {
      currentPlan = undefined;
    }
  }

  return (
    <section id="pricing" className="scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto mb-12 flex max-w-3xl flex-col items-center px-5 text-center">
        <p className="text-sm font-medium text-brand">Planes claros</p>
        <h2 className="mt-3 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
          Paga por capacidad creativa, no por promesas.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
          Empieza con créditos de bienvenida. Cuando necesites un ritmo
          constante, Pro renueva tu saldo en cada ciclo mensual.
        </p>
      </div>
      <PricingTable
        authenticated={Boolean(user)}
        currentPlan={currentPlan}
      />
      <p className="mx-auto mt-6 max-w-2xl px-5 text-center text-sm leading-6 text-muted">
        Sin plan anual ni prueba ficticia. El cobro y la administración de la
        suscripción se realizan de forma segura en Stripe.
      </p>
    </section>
  );
}
