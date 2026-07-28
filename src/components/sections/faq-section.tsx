import { Container } from "@/components/layout/container";
import { Accordion } from "@/components/ui/accordion";
import { faqs } from "@/config/landing";

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-24 py-24 sm:py-32">
      <Container className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
        <div>
          <h2 className="text-balance text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
            Preguntas frecuentes.
          </h2>
          <p className="mt-5 max-w-sm text-base leading-7 text-muted">
            Lo esencial sobre la primera versión de Crealy y su lanzamiento.
          </p>
        </div>
        <Accordion items={faqs} />
      </Container>
    </section>
  );
}
