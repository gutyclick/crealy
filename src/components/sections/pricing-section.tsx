"use client";

import { ArrowRight, Check, Coins, Sparkles } from "lucide-react";
import { useState } from "react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/config/landing";
import { cn } from "@/lib/utils";

type BillingCycle = "monthly" | "yearly";

export function PricingSection() {
  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>("monthly");

  return (
    <section
      id="pricing"
      className="scroll-mt-24 py-24 sm:py-32"
    >
      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="text-sm font-medium text-brand">
              Planes de lanzamiento
            </p>
            <h2 className="mt-3 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-foreground sm:text-5xl">
              Empieza con espacio para probar.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Dos planes previstos para cuando abramos la generación, ambos con
              7 días de prueba y tokens de bienvenida.
            </p>

            <div
              role="group"
              aria-label="Periodo de facturación"
              className="mt-8 inline-grid w-full grid-cols-2 rounded-[0.8rem] border border-white/10 bg-surface p-1 sm:w-auto"
            >
              <button
                type="button"
                aria-pressed={billingCycle === "monthly"}
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "min-h-10 rounded-[0.7rem] px-5 text-sm font-semibold transition-colors",
                  billingCycle === "monthly"
                    ? "bg-white/10 text-foreground"
                    : "text-muted hover:text-foreground",
                )}
              >
                Mensual
              </button>
              <button
                type="button"
                aria-pressed={billingCycle === "yearly"}
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "min-h-10 rounded-[0.7rem] px-5 text-sm font-semibold transition-colors",
                  billingCycle === "yearly"
                    ? "bg-white/10 text-foreground"
                    : "text-muted hover:text-foreground",
                )}
              >
                Anual
                <span className="ml-2 text-xs text-brand">−20%</span>
              </button>
            </div>
          </div>

          <div className="reveal-rise mt-12 grid gap-4 lg:grid-cols-2">
            {pricingPlans.map((plan) => {
              const yearlySavings =
                plan.monthlyPrice * 12 - plan.yearlyPrice;
              const displayedPrice =
                billingCycle === "monthly"
                  ? String(plan.monthlyPrice)
                  : (plan.yearlyPrice / 12).toFixed(2);

              return (
                <article
                  key={plan.name}
                  className={cn(
                    "relative flex min-h-full flex-col rounded-2xl border p-6 sm:p-8",
                    plan.featured
                      ? "border-brand/42 bg-surface-elevated"
                      : "border-white/10 bg-surface/45",
                  )}
                >
                  {plan.featured && (
                    <span className="absolute right-5 top-5 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-ink">
                      Recomendado
                    </span>
                  )}

                  <div className="pr-24">
                    <h3 className="text-xl font-semibold tracking-[-0.025em] text-foreground">
                      {plan.name}
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-6 text-muted">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mt-8 flex items-end gap-2 border-b border-white/10 pb-7">
                    <span className="pb-2 text-xl font-medium text-white/55">
                      $
                    </span>
                    <span className="text-5xl font-semibold tracking-[-0.04em] text-foreground sm:text-6xl">
                      {displayedPrice}
                    </span>
                    <span className="pb-2 text-sm text-muted">/mes</span>
                  </div>

                  {billingCycle === "yearly" && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-muted">
                        Facturado ${plan.yearlyPrice} al año
                      </span>
                      <span className="font-medium text-brand">
                        Ahorras ${yearlySavings}
                      </span>
                    </div>
                  )}

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Sparkles
                        aria-hidden="true"
                        className="size-4 shrink-0 text-brand"
                      />
                      <span className="text-sm text-white/75">
                        7 días de prueba
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Coins
                        aria-hidden="true"
                        className="size-4 shrink-0 text-brand"
                      />
                      <span className="text-sm text-white/75">
                        {plan.trialTokens} tokens gratis
                      </span>
                    </div>
                  </div>

                  <p className="mt-7 text-sm font-semibold text-foreground">
                    {plan.monthlyTokens} tokens cada mes
                  </p>
                  <ul className="mt-4 grid gap-3">
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

                  <Button
                    href="/signup"
                    size="lg"
                    variant={plan.featured ? "primary" : "secondary"}
                    className="mt-8 w-full"
                  >
                    Crear cuenta
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Button>
                </article>
              );
            })}
          </div>

          <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-6 text-white/65">
            Precios provisionales. Los valores, límites y equivalencias se
            confirmarán antes de abrir la generación.
          </p>
        </div>
      </Container>
    </section>
  );
}
