"use client";

import { Check, CircleHelp } from "lucide-react";
import { useState } from "react";

import { CheckoutButton } from "@/components/billing/checkout-button";
import { Button } from "@/components/ui/button";
import { PRICING_PLANS, displayPrice, type BillingPeriod, type PublicPlanId } from "@/config/plans";
import { cn } from "@/lib/utils";
import type { PlanKey } from "@/types/billing";

type PriceAvailability = Record<PaidPublicPlan, Record<BillingPeriod, string>>;
type PaidPublicPlan = Exclude<PublicPlanId, "free">;

export function PricingTableClient({ authenticated, currentPlan, compact, billingEnabled, availablePrices }: { authenticated: boolean; currentPlan?: PlanKey; compact: boolean; billingEnabled: boolean; availablePrices: PriceAvailability }) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const currentPublic: PublicPlanId | undefined = currentPlan === "starter" ? "starter" : currentPlan === "pro" ? "creator" : currentPlan === "business" ? "pro" : currentPlan;
  return <div className="mx-auto max-w-[90rem] px-5">
    {!compact ? <div className="mb-10 flex flex-col items-center gap-5 text-center">
      <div role="group" aria-label="Periodo de facturación" className="inline-grid grid-cols-2 rounded-xl border border-white/10 bg-surface p-1">
        <button type="button" aria-pressed={period === "monthly"} onClick={() => setPeriod("monthly")} className={cn("min-h-11 rounded-lg px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand", period === "monthly" ? "bg-white/10 text-foreground" : "text-muted hover:text-foreground")}>Mensual</button>
        <button type="button" aria-pressed={period === "annual"} onClick={() => setPeriod("annual")} className={cn("min-h-11 rounded-lg px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand", period === "annual" ? "bg-brand text-brand-ink" : "text-muted hover:text-foreground")}>Anual <span className="ml-1 text-xs">Ahorra 20%</span></button>
      </div>
      <div><p className="font-semibold text-foreground">No pagas por funciones. Pagas por crear más.</p><p className="mt-1 text-sm text-muted">Todos los planes incluyen las herramientas de creación con IA de Crealy.</p></div>
    </div> : null}
    <div className={cn("grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4", compact && "mx-auto max-w-6xl")}>
      {PRICING_PLANS.map((plan) => {
        const price = displayPrice(plan, period); const active = currentPublic === plan.id; const enabled = plan.id !== "free" && billingEnabled && Boolean(availablePrices[plan.id as PaidPublicPlan]?.[period]);
        return <article key={plan.id} className={cn("relative flex min-h-full flex-col rounded-2xl border bg-surface p-6 transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-1 sm:p-7", plan.popular ? "border-brand/70 bg-surface-elevated shadow-[0_18px_55px_rgba(221,245,39,.08)] xl:-translate-y-2 xl:hover:-translate-y-3" : "border-white/10 hover:border-white/20")}>
          {plan.popular ? <span className="absolute right-5 top-0 -translate-y-1/2 rounded-full bg-brand px-3 py-1 text-xs font-bold text-brand-ink">Más popular</span> : null}
          <div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-semibold tracking-[-0.025em] text-foreground">{plan.name}</h3><p className="mt-3 min-h-12 text-sm leading-6 text-muted">{plan.description}</p></div>{active ? <span className="rounded-lg border border-brand/30 px-2 py-1 text-xs font-semibold text-brand">Plan actual</span> : null}</div>
          <div className="mt-7 border-y border-white/10 py-5"><p className="text-sm font-semibold text-foreground">Hasta {plan.estimatedUsage.standard} diseños al mes</p><div className="mt-3 flex items-end gap-2" aria-live="polite"><span key={`${plan.id}-${period}`} className="price-swap text-5xl font-semibold tracking-[-0.04em] text-foreground">{price.primary}</span><span className="pb-1.5 text-sm text-muted">{price.suffix}</span></div><p className="mt-2 min-h-5 text-xs text-muted">{price.detail}</p>{plan.id === "creator" && period === "monthly" ? <p className="mt-2 text-xs font-medium text-brand">Aproximadamente $0.50 al día</p> : null}</div>
          <div className="mt-5 rounded-xl bg-background p-4"><div className="flex items-center gap-2 text-xs font-semibold text-foreground">Capacidad aproximada <CircleHelp className="size-3.5 text-muted" aria-hidden="true" /></div><ul className="mt-3 space-y-1.5 text-xs leading-5 text-muted"><li>{plan.estimatedUsage.standard} diseños estándar</li><li>{plan.estimatedUsage.hd ? `${plan.estimatedUsage.hd} diseños HD` : "Combina calidad estándar y HD"}</li>{plan.estimatedUsage.bannerOrCover ? <li>{plan.estimatedUsage.bannerOrCover} banners o covers</li> : null}<li>o una combinación libre</li></ul></div>
          <ul className="my-6 grid gap-2.5">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-2.5 text-sm leading-5 text-muted"><Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />{feature}</li>)}</ul>
          <div className="mt-auto">{active ? <Button href="/settings/billing" variant="secondary" size="lg" className="w-full">Ver mi facturación</Button> : plan.id === "free" ? <Button href={authenticated ? "/create" : "/signup"} variant="secondary" size="lg" className="w-full">{plan.cta}</Button> : <CheckoutButton plan={plan.id as PaidPublicPlan} period={period} planName={plan.name} cta={plan.cta} authenticated={authenticated} enabled={enabled} />}<p className="mt-3 min-h-10 text-center text-xs leading-5 text-muted">{plan.supportingText}</p></div>
        </article>;
      })}
    </div>
    {!compact ? <div className="mx-auto mt-10 max-w-3xl border-y border-white/10 py-6 text-center"><p className="font-semibold text-foreground">Combina tus créditos como prefieras.</p><p className="mt-2 text-sm leading-6 text-muted">Diseño estándar: 1 crédito · Diseño HD: 3 créditos · Banner o cover: 5 créditos</p></div> : null}
  </div>;
}
