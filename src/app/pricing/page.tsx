import { ArrowDown } from "lucide-react";

import { PricingTable } from "@/components/billing/pricing-table";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUserBillingState } from "@/lib/billing/get-user-billing-state";
import { createMetadata } from "@/lib/seo/create-metadata";

export const metadata = createMetadata({
  title: "Precios y créditos",
  description: "Planes mensuales y créditos para crear y editar contenido visual con Crealy.",
  path: "/pricing",
  image: "/pricing/opengraph-image",
});

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const [user, query] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);
  let currentPlan: "free" | "pro" | "business" | undefined;
  if (user) {
    try {
      currentPlan = (await getUserBillingState(user.id)).effectivePlan.key;
    } catch {
      currentPlan = undefined;
    }
  }

  return (
    <>
      <Header />
      <main className="pt-16 sm:pt-[4.5rem]">
        <section className="relative overflow-hidden border-b border-white/[0.08] py-20 text-center sm:py-28">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-brand/70"
          />
          <div className="relative mx-auto max-w-4xl px-5">
            <p className="text-sm font-medium text-brand">Créditos Crealy</p>
            <h1 className="mt-4 text-balance text-5xl font-semibold leading-[0.96] tracking-[-0.04em] sm:text-7xl">
              Un plan que sigue tu ritmo de publicación.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Cada creación usa una cantidad visible de créditos. Empieza
              gratis y activa Pro solo cuando necesites producir cada mes.
            </p>
            <ArrowDown
              aria-hidden="true"
              className="mx-auto mt-9 size-5 text-white/45"
            />
          </div>
        </section>

        {query.checkout === "cancelled" && (
          <p
            role="status"
            className="mx-auto mt-8 max-w-2xl px-5 text-center text-sm text-muted"
          >
            El pago se canceló y no se realizó ningún cargo. Puedes elegir un
            plan cuando quieras.
          </p>
        )}

        <section className="py-16 sm:py-24">
          <PricingTable
            authenticated={Boolean(user)}
            currentPlan={currentPlan}
          />
        </section>

        <section className="border-t border-white/[0.08] bg-surface-soft py-20 sm:py-24">
          <div className="mx-auto grid max-w-5xl gap-10 px-5 md:grid-cols-[0.8fr_1.2fr]">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Lo importante, antes de pagar.
            </h2>
            <dl className="divide-y divide-white/10 border-y border-white/10">
              <div className="grid gap-2 py-5 sm:grid-cols-[11rem_1fr]">
                <dt className="font-medium text-foreground">¿Caducan?</dt>
                <dd className="text-sm leading-6 text-muted">
                  Los créditos mensuales duran hasta el cierre del ciclo. Los
                  créditos de bienvenida no caducan.
                </dd>
              </div>
              <div className="grid gap-2 py-5 sm:grid-cols-[11rem_1fr]">
                <dt className="font-medium text-foreground">¿Puedo cancelar?</dt>
                <dd className="text-sm leading-6 text-muted">
                  Sí. Stripe permite administrar o cancelar tu suscripción
                  desde el portal de facturación.
                </dd>
              </div>
              <div className="grid gap-2 py-5 sm:grid-cols-[11rem_1fr]">
                <dt className="font-medium text-foreground">¿Hay plan anual?</dt>
                <dd className="text-sm leading-6 text-muted">
                  No por ahora. Solo mostramos planes y precios realmente
                  configurados.
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
