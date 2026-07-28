import { ArrowRight, Check } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { earlyAccessFeatures } from "@/config/landing";

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-24 border-y border-white/[0.07] bg-surface/35 py-24 sm:py-32"
    >
      <Container>
        <div className="mx-auto grid max-w-5xl gap-10 rounded-2xl bg-surface-elevated p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-medium text-brand">Acceso anticipado</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
              Conoce Crealy desde el principio.
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-muted">
              Los planes y límites se anunciarán antes del lanzamiento.
            </p>
            <Button href="#final-cta" size="lg" className="mt-7">
              Unirme a la lista
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </div>

          <div className="grid sm:grid-cols-2">
            {earlyAccessFeatures.map((feature, index) => (
              <div
                key={feature}
                className={
                  index === earlyAccessFeatures.length - 1
                    ? "flex items-start gap-3 border-t border-brand/25 py-4 sm:col-span-2"
                    : "flex items-start gap-3 border-t border-white/10 py-4 sm:pr-6"
                }
              >
                <Check
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-brand"
                />
                <span className="text-sm leading-6 text-white/72">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
