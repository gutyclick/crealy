import { Container } from "@/components/layout/container";
import { Accordion } from "@/components/ui/accordion";
import { faqs } from "@/config/landing";

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-24 py-24 sm:py-32">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
            Lo esencial, sin letra pequeña.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted">
            Qué podrás crear, qué está disponible y cómo estamos construyendo
            la primera versión.
          </p>
        </div>
        <div className="reveal-rise mx-auto mt-12 max-w-3xl">
          <Accordion items={faqs} />
        </div>
      </Container>
    </section>
  );
}
