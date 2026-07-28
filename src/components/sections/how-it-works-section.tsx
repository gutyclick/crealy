import {
  ArrowDown,
  ArrowRight,
  Download,
  LayoutTemplate,
  Type,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { creationSteps } from "@/config/landing";

const icons = [LayoutTemplate, Type, Download] as const;

function StepVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="grid grid-cols-3 gap-2" aria-hidden="true">
        <span className="aspect-video rounded-md bg-brand/85" />
        <span className="aspect-square rounded-md bg-white/10" />
        <span className="aspect-[4/5] rounded-md bg-white/[0.06]" />
      </div>
    );
  }

  if (index === 1) {
    return (
      <div
        aria-hidden="true"
        className="rounded-lg border border-white/[0.1] bg-background/45 p-3"
      >
        <span className="block h-1.5 w-full rounded-full bg-white/10" />
        <span className="mt-2 block h-1.5 w-4/5 rounded-full bg-white/10" />
        <span className="mt-2 block h-1.5 w-2/5 rounded-full bg-brand/65" />
      </div>
    );
  }

  return (
    <div className="flex gap-2" aria-hidden="true">
      <span className="h-16 flex-1 rounded-lg bg-[linear-gradient(145deg,#202020,#DDF527)]" />
      <span className="h-16 flex-1 rounded-lg bg-[linear-gradient(145deg,#333,#111)]" />
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-y border-white/[0.07] bg-surface/35 py-24 sm:py-32"
    >
      <Container>
        <SectionHeading
          title="De una idea a una imagen en tres pasos."
          description="Un proceso corto para mantener tu atención en el mensaje, no en la herramienta."
        />

        <div className="mt-14 grid md:grid-cols-3">
          {creationSteps.map((step, index) => {
            const Icon = icons[index];

            return (
              <article
                key={step.title}
                className="relative border-b border-white/[0.09] py-8 last:border-b-0 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-brand">
                    0{index + 1}
                  </span>
                  <Icon aria-hidden="true" className="size-5 text-white/42" />
                </div>

                <div className="mt-8 max-w-56">
                  <StepVisual index={index} />
                </div>

                <h3 className="mt-7 text-xl font-semibold tracking-[-0.02em] text-foreground">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
                  {step.description}
                </p>

                {index < creationSteps.length - 1 ? (
                  <>
                    <ArrowRight
                      aria-hidden="true"
                      className="absolute right-[-0.7rem] top-1/2 z-10 hidden size-5 text-brand md:block"
                    />
                    <ArrowDown
                      aria-hidden="true"
                      className="absolute bottom-[-0.65rem] left-1/2 z-10 size-5 -translate-x-1/2 text-brand md:hidden"
                    />
                  </>
                ) : null}
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
