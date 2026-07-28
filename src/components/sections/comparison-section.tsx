import { Check, Minus } from "lucide-react";

import { Container } from "@/components/layout/container";
import { crealyFlow, traditionalFlow } from "@/config/landing";

export function ComparisonSection() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
            No necesitas convertirte en diseñador.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted">
            Crealy está pensado para quienes quieren avanzar rápido con una
            experiencia guiada.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl overflow-hidden rounded-2xl border border-white/[0.1] md:grid-cols-2">
          <article className="bg-surface p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-white/72">
              Herramienta tradicional
            </h3>
            <ul className="mt-7 grid gap-4">
              {traditionalFlow.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-muted"
                >
                  <Minus aria-hidden="true" className="size-4 text-white/28" />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="relative overflow-hidden border-t border-white/[0.1] bg-[#13150b] p-6 sm:p-8 md:border-l md:border-t-0">
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-24 size-64 rounded-full bg-brand/10 blur-3xl"
            />
            <h3 className="relative text-lg font-semibold text-foreground">
              Con Crealy
            </h3>
            <ul className="relative mt-7 grid gap-4">
              {crealyFlow.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-white/78"
                >
                  <span className="grid size-5 place-items-center rounded-full bg-brand text-brand-ink">
                    <Check aria-hidden="true" className="size-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </Container>
    </section>
  );
}
