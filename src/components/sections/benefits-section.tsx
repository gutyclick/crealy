import {
  Clock3,
  Layers3,
  MousePointer2,
  Shapes,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { benefits } from "@/config/landing";

const icons = [MousePointer2, Shapes, Layers3, Clock3] as const;

export function BenefitsSection() {
  return (
    <section className="py-24 sm:py-32">
      <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="lg:sticky lg:top-32">
          <h2 className="max-w-[11ch] text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-foreground sm:text-5xl">
            Menos tiempo ajustando. Más tiempo creando.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-muted">
            Crealy reduce las decisiones repetitivas para que puedas concentrarte
            en lo que quieres comunicar.
          </p>

          <div
            aria-hidden="true"
            className="relative mt-12 hidden aspect-[5/3] max-w-md overflow-hidden rounded-2xl bg-surface lg:block"
          >
            <div className="absolute -bottom-16 -right-10 size-64 rounded-full bg-brand" />
            <div className="absolute left-8 top-8 h-20 w-36 rounded-xl border border-white/15 bg-white/[0.06]" />
            <div className="absolute bottom-8 left-8 h-2 w-24 bg-white/65" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {benefits.map((benefit, index) => {
            const Icon = icons[index];

            return (
              <article
                key={benefit.title}
                className={
                  index === 0
                    ? "min-h-64 rounded-2xl bg-brand p-6 text-brand-ink sm:row-span-2 sm:min-h-[33rem]"
                    : "min-h-60 rounded-2xl bg-surface p-6"
                }
              >
                <Icon
                  aria-hidden="true"
                  className={
                    index === 0
                      ? "size-6 text-brand-ink"
                      : "size-6 text-brand"
                  }
                />
                <div className={index === 0 ? "mt-24 sm:mt-72" : "mt-20"}>
                  <h3 className="text-xl font-semibold tracking-[-0.025em]">
                    {benefit.title}
                  </h3>
                  <p
                    className={
                      index === 0
                        ? "mt-3 text-sm leading-6 text-brand-ink/72"
                        : "mt-3 text-sm leading-6 text-muted"
                    }
                  >
                    {benefit.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
