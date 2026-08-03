import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export function FinalCtaSection() {
  return (
    <section id="final-cta" className="scroll-mt-24 pb-14 sm:pb-32">
      <Container>
        <div className="reveal-clip relative overflow-hidden rounded-2xl border border-white/[0.1] bg-surface-elevated px-6 py-12 text-center text-foreground sm:px-10 sm:py-24">
          <div
            aria-hidden="true"
            className="absolute -left-16 -top-24 size-72 rounded-full border border-brand/15"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-32 -right-20 size-80 rounded-full border border-brand/15"
          />

          <div className="relative mx-auto max-w-3xl">
            <h2 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl">
              Tu próxima pieza puede empezar con una frase.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg">
              Crea tu cuenta hoy y acompaña el desarrollo de una forma más
              directa de producir contenido visual.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 min-[420px]:flex-row">
              <Button
                href="/signup"
                size="lg"
              >
                Crear cuenta
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
              <Button
                href="#preview"
                variant="secondary"
                size="lg"
              >
                Ver la demo
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
