import { ArrowRight, Check, Coins, ImageIcon, WandSparkles } from "lucide-react";

import { CheckoutButton } from "@/components/billing/checkout-button";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { getPlanDefinitions } from "@/config/plans";
import { getCreditServerEnv, getBillingServerEnv } from "@/lib/env/server";
import { cn } from "@/lib/utils";

export function PricingTable({
  authenticated,
  currentPlan,
  compact = false,
}: {
  authenticated: boolean;
  currentPlan?: "free" | "pro" | "business";
  compact?: boolean;
}) {
  const credits = getCreditServerEnv();
  const billing = getBillingServerEnv();
  const plans = getPlanDefinitions({
    ...credits,
    proPriceLabel: billing.proPriceDisplay,
    businessPriceLabel: billing.businessPriceDisplay,
    businessVisible: Boolean(
      billing.businessPlanEnabled &&
        billing.businessPriceId &&
        billing.businessPriceDisplay,
    ),
  }).filter((plan) => plan.isVisible);

  return (
    <Container>
      {!compact && (
        <div className="mx-auto mb-12 grid max-w-3xl grid-cols-3 border-y border-white/10 py-5 text-center">
          <div>
            <ImageIcon
              aria-hidden="true"
              className="mx-auto size-4 text-brand"
            />
            <p className="mt-2 text-sm text-muted">Creación estándar</p>
            <p className="mt-1 font-mono text-xs text-foreground">
              {credits.generationStandardCost} crédito
            </p>
          </div>
          <div className="border-x border-white/10 px-2">
            <WandSparkles
              aria-hidden="true"
              className="mx-auto size-4 text-brand"
            />
            <p className="mt-2 text-sm text-muted">Alta calidad</p>
            <p className="mt-1 font-mono text-xs text-foreground">
              {credits.generationHighCost} créditos
            </p>
          </div>
          <div>
            <Coins
              aria-hidden="true"
              className="mx-auto size-4 text-brand"
            />
            <p className="mt-2 text-sm text-muted">Edición</p>
            <p className="mt-1 font-mono text-xs text-foreground">
              {credits.editCost} crédito
            </p>
          </div>
        </div>
      )}

      <div
        className={cn(
          "pricing-reveal mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-surface lg:grid-cols-2",
          compact && "max-w-4xl",
        )}
      >
        {plans.map((plan, index) => {
          const active = currentPlan === plan.key;
          return (
            <article
              key={plan.key}
              className={cn(
                "relative flex min-h-full flex-col p-7 sm:p-10",
                index > 0 && "border-t border-white/10 lg:border-l lg:border-t-0",
                plan.featured && "bg-surface-elevated",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold tracking-[-0.03em]">
                    {plan.name}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
                    {plan.description}
                  </p>
                </div>
                {active && (
                  <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-ink">
                    Plan actual
                  </span>
                )}
              </div>

              <div className="mt-9 border-b border-white/10 pb-7">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
                    {plan.key === "free" ? "$0" : plan.priceLabel}
                  </span>
                  {plan.priceSuffix && (
                    <span className="pb-2 text-sm text-muted">
                      {plan.priceSuffix}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">
                  {plan.key === "free"
                    ? `${credits.freeSignupCredits} créditos al registrarte`
                    : `${plan.monthlyCredits} créditos por ciclo mensual`}
                </p>
              </div>

              <ul className="my-7 grid gap-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm leading-6 text-muted"
                  >
                    <Check
                      aria-hidden="true"
                      className="mt-1 size-4 shrink-0 text-brand"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {active ? (
                  <Button
                    href={authenticated ? "/settings/billing" : "/signup"}
                    variant="secondary"
                    size="lg"
                    className="w-full"
                  >
                    Ver mi facturación
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Button>
                ) : plan.key === "free" ? (
                  <Button
                    href={authenticated ? "/create" : "/signup"}
                    variant="secondary"
                    size="lg"
                    className="w-full"
                  >
                    {authenticated ? "Ir a Crear" : "Empezar gratis"}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Button>
                ) : (
                  <CheckoutButton
                    plan={plan.key}
                    planName={plan.name}
                    authenticated={authenticated}
                    enabled={
                      billing.billingEnabled &&
                      (plan.key === "pro"
                        ? Boolean(
                            billing.proPriceId && billing.proPriceDisplay,
                          )
                        : Boolean(
                            billing.businessPriceId &&
                              billing.businessPriceDisplay,
                          ))
                    }
                  />
                )}
              </div>
            </article>
          );
        })}
      </div>
    </Container>
  );
}
