import { PricingTable } from "@/components/billing/pricing-table";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUserBillingState } from "@/lib/billing/get-user-billing-state";
import { createMetadata } from "@/lib/seo/create-metadata";
import type { PlanKey } from "@/types/billing";

export const metadata = createMetadata({ title: "Planes para crear más", description: "Elige cuánta capacidad creativa necesitas cada mes con Crealy.", path: "/pricing", image: "/pricing/opengraph-image" });

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ checkout?: string; plan?: string; period?: string }> }) {
  const [user, query] = await Promise.all([getCurrentUser(), searchParams]); let currentPlan: PlanKey | undefined;
  if (user) try { currentPlan = (await getUserBillingState(user.id)).effectivePlan.key; } catch { currentPlan = undefined; }
  return <><Header /><main className="pt-16 sm:pt-[4.5rem]">
    <section className="relative overflow-hidden border-b border-white/[0.08] py-11 text-center sm:py-16"><div aria-hidden="true" className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-brand/70"/><div className="relative mx-auto max-w-4xl px-5"><h1 className="text-balance text-4xl font-semibold leading-[0.96] tracking-[-0.04em] sm:text-6xl">¿Cuánto quieres crear?</h1><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">Empieza gratis y mejora tu plan cuando necesites crear más.</p></div></section>
    {query.checkout === "cancelled" ? <p role="status" className="mx-auto mt-8 max-w-2xl px-5 text-center text-sm text-muted">El pago se canceló y no se realizó ningún cargo. Puedes elegir un plan cuando quieras.</p> : null}
    <section className="py-8 sm:py-16"><PricingTable authenticated={Boolean(user)} currentPlan={currentPlan} initialPeriod={query.period === "annual" ? "annual" : "monthly"}/></section>
    <section className="border-t border-white/[0.08] bg-surface-soft py-14 sm:py-24"><div className="mx-auto grid max-w-5xl gap-8 px-5 md:grid-cols-[0.8fr_1.2fr]"><h2 className="text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Lo importante, antes de pagar.</h2><dl className="divide-y divide-white/10 border-y border-white/10"><Faq term="¿Caducan?">Los créditos mensuales duran hasta el cierre del ciclo. Los créditos de bienvenida no caducan.</Faq><Faq term="¿Puedo cancelar?">Sí. Administra o cancela tu suscripción desde el portal seguro de Stripe.</Faq><Faq term="¿Hay plan anual?">Sí. La opción anual se factura en un solo pago e incluye el ahorro indicado en la tabla.</Faq><Faq term="¿Qué puedo crear?">Combina tus créditos entre miniaturas, posts, Recreate, banners y covers según lo que necesites.</Faq></dl></div></section>
  </main><Footer /></>;
}

function Faq({ term, children }: { term: string; children: React.ReactNode }) { return <div className="grid gap-2 py-5 sm:grid-cols-[11rem_1fr]"><dt className="font-medium text-foreground">{term}</dt><dd className="text-sm leading-6 text-muted">{children}</dd></div>; }
