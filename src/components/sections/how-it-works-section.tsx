import { Download, LayoutTemplate, MousePointer2, Type } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { creationSteps } from "@/config/landing";

const icons = [LayoutTemplate, Type, Download] as const;

function StepVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="grid grid-cols-[1.45fr_0.8fr_0.65fr] items-end gap-2" aria-hidden="true">
        <span className="aspect-video rounded-md bg-brand/90" />
        <span className="aspect-square rounded-md bg-white/12" />
        <span className="aspect-[4/5] rounded-md bg-white/[0.07]" />
      </div>
    );
  }

  if (index === 1) {
    return (
      <div
        aria-hidden="true"
        className="relative rounded-lg border border-white/[0.12] bg-background/70 p-3.5"
      >
        <span className="block h-1.5 w-full rounded-full bg-white/13" />
        <span className="mt-2.5 block h-1.5 w-4/5 rounded-full bg-white/13" />
        <span className="mt-2.5 block h-1.5 w-2/5 rounded-full bg-brand/75" />
        <MousePointer2 className="absolute -bottom-2 right-4 size-5 fill-background text-brand" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2" aria-hidden="true">
      <span className="aspect-square rounded-lg bg-[linear-gradient(145deg,#2546a8,#6fcbff)]" />
      <span className="aspect-square rounded-lg bg-[linear-gradient(145deg,#c84b5f,#ff8a6b)]" />
      <span className="aspect-square rounded-lg bg-[linear-gradient(145deg,#30351f,#DDF527)]" />
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 py-14 sm:py-32"
    >
      <Container>
        <SectionHeading
          align="center"
          title="Tres decisiones. Nada más."
          description="Un proceso corto para mantener tu atención en el mensaje y llegar antes a una dirección útil."
        />

        <div className="mobile-content-rail reveal-rise mx-auto mt-9 flex max-w-6xl snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:mt-14 md:grid md:grid-cols-3 md:gap-0 md:overflow-hidden md:rounded-2xl md:border md:border-white/[0.1] md:bg-surface md:pb-0">
          {creationSteps.map((step, index) => {
            const Icon = icons[index];

            return (
              <article
                key={step.title}
                className="relative flex min-h-[21rem] w-[82vw] shrink-0 snap-center flex-col items-center rounded-2xl border border-white/[0.1] bg-surface p-7 text-center md:min-h-[23rem] md:w-auto md:rounded-none md:border-y-0 md:border-l-0 md:border-r md:p-8 md:last:border-r-0"
              >
                <div className="flex w-full items-center justify-between">
                  <Icon aria-hidden="true" className="size-5 text-brand" />
                  <span className="font-mono text-xs text-white/55">
                    {index === 0 ? "FORMATO" : index === 1 ? "IDEA" : "SALIDA"}
                  </span>
                </div>

                <div className="my-12 w-full max-w-56">
                  <StepVisual index={index} />
                </div>

                <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                  {step.title}
                </h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-muted">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
