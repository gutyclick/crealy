"use client";

import { Check, CircleHelp, LockKeyhole } from "lucide-react";
import { useState, type ReactNode } from "react";

import { CheckoutButton } from "@/components/billing/checkout-button";
import { PortalButton } from "@/components/billing/portal-button";
import { Button } from "@/components/ui/button";
import {
  PRICING_PLANS,
  displayPrice,
  type BillingPeriod,
  type PublicPlanId,
} from "@/config/plans";
import { cn } from "@/lib/utils";
import type { PlanKey } from "@/types/billing";

type PaidPublicPlan = Exclude<PublicPlanId, "free">;
type PriceAvailability = Record<
  PaidPublicPlan,
  Record<BillingPeriod, string>
>;

function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onBlur={() => setOpen(false)}
        className="grid size-11 place-items-center rounded-[var(--radius-control)] text-muted transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <CircleHelp aria-hidden="true" className="size-3.5" />
      </button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none fixed inset-x-4 bottom-24 z-50 mx-auto w-auto max-w-64 rounded-xl border border-white/10 bg-surface-elevated p-3 text-left text-xs font-normal leading-5 text-white/80 shadow-[var(--shadow-tooltip)] transition-[opacity,transform] sm:absolute sm:inset-x-auto sm:bottom-[calc(100%+0.5rem)] sm:left-1/2 sm:w-64 sm:-translate-x-1/2",
          open
            ? "translate-y-0 opacity-100"
            : "translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100",
        )}
      >
        {children}
      </span>
    </span>
  );
}

export function PricingTableClient({
  authenticated,
  currentPlan,
  compact,
  initialPeriod,
  billingEnabled,
  availablePrices,
}: {
  authenticated: boolean;
  currentPlan?: PlanKey;
  compact: boolean;
  initialPeriod: BillingPeriod;
  billingEnabled: boolean;
  availablePrices: PriceAvailability;
}) {
  const [period, setPeriod] = useState<BillingPeriod>(initialPeriod);
  const currentPublic: PublicPlanId | undefined =
    currentPlan === "starter"
      ? "starter"
      : currentPlan === "pro"
        ? "creator"
        : currentPlan === "business"
          ? "pro"
          : currentPlan;
  const visiblePlans = compact
    ? PRICING_PLANS.filter((plan) => plan.id !== "free")
    : PRICING_PLANS;

  return (
    <div className={cn("mx-auto", compact ? "max-w-7xl" : "max-w-[90rem] px-5")}>
      <div className={cn("flex flex-col items-center text-center", compact ? "mb-7 gap-3" : "mb-10 gap-5")}>
        <div
          role="group"
          aria-label="Periodo de facturación"
          className="inline-grid w-full max-w-sm grid-cols-2 rounded-xl border border-white/10 bg-surface p-1 sm:w-auto"
        >
          <button
            type="button"
            aria-pressed={period === "monthly"}
            onClick={() => setPeriod("monthly")}
            className={cn(
              "min-h-11 rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-5",
              period === "monthly"
                ? "bg-white/10 text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            Mensual
          </button>
          <button
            type="button"
            aria-pressed={period === "annual"}
            onClick={() => setPeriod("annual")}
            className={cn(
              "min-h-11 rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-5",
              period === "annual"
                ? "bg-brand text-brand-ink"
                : "text-muted hover:text-foreground",
            )}
          >
            Anual <span className="ml-1 text-xs">Ahorra 20%</span>
          </button>
        </div>
        {!compact ? (
          <div>
            <p className="font-semibold text-foreground">
              No pagas por funciones. Pagas por crear más.
            </p>
            <p className="mt-1 text-sm text-muted">
              Todos los planes incluyen las herramientas de creación de
              Crealy.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted">Cambia o cancela desde Stripe cuando quieras.</p>
        )}
      </div>

      {!compact ? <p className="mb-3 text-center text-xs text-[var(--text-meta)] md:hidden">
        Desliza para comparar los planes
      </p> : null}

      <div
        className={cn(
          compact
            ? "grid grid-cols-1 items-stretch gap-3 md:grid-cols-3 md:gap-4"
            : "mobile-content-rail flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 xl:grid-cols-4",
        )}
      >
        {visiblePlans.map((plan) => {
          const price = displayPrice(plan, period);
          const active = currentPublic === plan.id;
          const hasFirmaVisual = plan.id === "creator" || plan.id === "pro";
          const enabled =
            plan.id !== "free" &&
            billingEnabled &&
            Boolean(availablePrices[plan.id as PaidPublicPlan]?.[period]);

          return (
            <article
              key={plan.id}
              className={cn(
                "relative flex min-h-full shrink-0 flex-col rounded-2xl border bg-surface p-5 transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-1 sm:p-6",
                compact ? "w-full" : "w-[84vw] snap-center md:w-auto sm:p-7",
                plan.popular
                  ? cn("border-brand/70 bg-surface-elevated shadow-[0_18px_55px_rgba(221,245,39,.08)]", !compact && "xl:-translate-y-2 xl:hover:-translate-y-3")
                  : "border-white/10 hover:border-white/20",
              )}
            >
              {plan.popular ? (
                <span className="absolute right-5 top-0 -translate-y-1/2 rounded-full bg-brand px-3 py-1 text-xs font-bold text-brand-ink">
                  Más popular
                </span>
              ) : null}

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.025em] text-foreground">
                    {plan.name}
                  </h3>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-muted">
                    {plan.description}
                  </p>
                </div>
                {active ? (
                  <span className="rounded-lg border border-brand/30 px-2 py-1 text-xs font-semibold text-brand">
                    Plan actual
                  </span>
                ) : null}
              </div>

              <div className="mt-7 border-y border-white/10 py-5">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-semibold text-foreground">
                    Hasta {plan.estimatedUsage.standard} diseños al mes
                  </p>
                  <Tooltip
                    label={`Cómo se calculan los ${plan.estimatedUsage.standard} diseños`}
                  >
                    Calculado con piezas de 1 crédito. Miniatura: 1; post: 1 o
                    2; Recreate: 2 o 3; banner o cover: 5 créditos. Puedes
                    combinarlos como quieras.
                  </Tooltip>
                </div>
                <div className="mt-3 flex items-end gap-2" aria-live="polite">
                  <span
                    key={`${plan.id}-${period}`}
                    className={cn("price-swap font-semibold tracking-[-0.04em] text-foreground", compact ? "text-4xl" : "text-5xl")}
                  >
                    {price.primary}
                  </span>
                  <span className="pb-1.5 text-sm text-muted">
                    {price.suffix}
                  </span>
                </div>
                <p className="mt-2 min-h-5 text-xs text-muted">
                  {price.detail}
                </p>
                {plan.id === "creator" && period === "monthly" ? (
                  <p className="mt-2 text-xs font-medium text-brand">
                    Aproximadamente $0.50 al día
                  </p>
                ) : null}
              </div>

              <ul className="my-6 grid gap-2.5">
                <li
                  className={cn(
                    "flex items-start gap-2.5 text-sm leading-5",
                    hasFirmaVisual ? "text-muted" : "text-white/40",
                  )}
                >
                  {hasFirmaVisual ? (
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-brand"
                    />
                  ) : (
                    <LockKeyhole
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                    />
                  )}
                  <span className="flex items-center gap-1">
                    Firma visual
                    {!hasFirmaVisual ? (
                      <span className="sr-only">No incluida en este plan.</span>
                    ) : null}
                    <Tooltip label="Qué es Firma visual">
                      Crealy aprende los patrones visuales de tu marca para
                      mantener una identidad reconocible en nuevas creaciones
                      originales. Disponible en Creator y Pro.
                    </Tooltip>
                  </span>
                </li>
                {plan.features.map((feature, featureIndex) => (
                  <li
                    key={feature}
                    className={cn(
                      "items-start gap-2.5 text-sm leading-5 text-muted",
                      featureIndex < 3
                        ? "flex"
                        : compact
                          ? "hidden"
                          : "hidden sm:flex",
                    )}
                  >
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-brand"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {active && plan.id !== "free" ? (
                  <PortalButton
                    label="Administrar mi suscripción"
                    className="w-full"
                  />
                ) : active ? (
                  <Button
                    href="/create"
                    variant="secondary"
                    size="lg"
                    className="w-full"
                  >
                    Seguir creando
                  </Button>
                ) : plan.id === "free" ? (
                  <Button
                    href={authenticated ? "/create" : "/signup"}
                    variant="secondary"
                    size="lg"
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                ) : (
                  <CheckoutButton
                    plan={plan.id as PaidPublicPlan}
                    period={period}
                    planName={plan.name}
                    cta={plan.cta}
                    authenticated={authenticated}
                    enabled={enabled}
                  />
                )}
                <p className="mt-3 min-h-10 text-center text-xs leading-5 text-muted">
                  {plan.supportingText}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
