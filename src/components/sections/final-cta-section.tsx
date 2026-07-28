import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export function FinalCtaSection() {
  return (
    <section id="final-cta" className="scroll-mt-24 pb-24 sm:pb-32">
      <Container>
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-surface px-6 py-16 text-center sm:px-10 sm:py-20">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-brand to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-0 h-40 w-96 -translate-x-1/2 bg-brand/8 blur-3xl"
          />
          <div className="relative">
            <h2 className="mx-auto max-w-[13ch] text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-foreground sm:text-5xl">
              Tu próxima idea puede empezar aquí.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted">
              Crea contenido visual sin perder horas frente a una herramienta
              complicada.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row">
              <Button href="#pricing" size="lg">
                Empezar a crear
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
              <Button href="#examples" variant="secondary" size="lg">
                Ver ejemplos
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
