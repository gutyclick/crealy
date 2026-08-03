import { ArrowRight, Check, Minus } from "lucide-react";

import { Container } from "@/components/layout/container";
import { crealyFlow, traditionalFlow } from "@/config/landing";

export function ComparisonSection() {
  return (
    <section className="section-surface border-y border-white/[0.07] py-14 sm:py-32">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-foreground sm:text-5xl">
            Menos ajustes. Más intención.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            Crealy reduce las decisiones repetitivas para que puedas concentrarte
            en lo que quieres comunicar.
          </p>
        </div>

        <div className="reveal-rise mx-auto mt-14 grid max-w-6xl items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <article className="rounded-2xl border border-white/[0.09] bg-background/70 p-7 sm:p-9">
            <p className="text-sm font-semibold text-white/62">
              En un editor tradicional
            </p>
            <h3 className="mt-4 max-w-[13ch] text-3xl font-semibold tracking-[-0.035em] text-foreground">
              Cada formato abre otra ronda de ajustes.
            </h3>
            <ul className="mt-9 grid gap-4">
              {traditionalFlow.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-muted"
                >
                  <Minus aria-hidden="true" className="size-4 text-white/50" />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <div
            aria-hidden="true"
            className="mx-auto grid size-12 place-items-center self-center rounded-full border border-brand/35 bg-brand/10 text-brand lg:-mx-2"
          >
            <ArrowRight className="size-5 rotate-90 lg:rotate-0" />
          </div>

          <article className="relative overflow-hidden rounded-2xl border border-brand/28 bg-[#171a0c] p-7 sm:p-9">
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-24 size-64 rounded-full bg-brand/9 blur-3xl"
            />
            <div className="relative">
              <p className="text-sm font-semibold text-brand">Con Crealy</p>
              <h3 className="mt-4 max-w-[13ch] text-3xl font-semibold tracking-[-0.035em] text-foreground">
                Una ruta clara desde la idea hasta la pieza.
              </h3>
              <ul className="mt-9 grid gap-4">
                {crealyFlow.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm font-medium text-white/82"
                  >
                    <span className="grid size-6 place-items-center rounded-full bg-brand text-brand-ink">
                      <Check aria-hidden="true" className="size-3.5" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}
