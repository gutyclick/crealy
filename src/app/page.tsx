import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ComparisonSection } from "@/components/sections/comparison-section";
import { ContentTypesSection } from "@/components/sections/content-types-section";
import { ExamplesSection } from "@/components/sections/examples-section";
import { FaqSection } from "@/components/sections/faq-section";
import { FinalCtaSection } from "@/components/sections/final-cta-section";
import { HeroSection } from "@/components/sections/hero-section";
import { HowItWorksSection } from "@/components/sections/how-it-works-section";
import { PricingSection } from "@/components/sections/pricing-section";
import { ProductPreview } from "@/components/sections/product-preview";

/*
THESIS: Crealy convierte una descripción breve en piezas listas para publicar y rechaza la complejidad de un editor generalista.
OWN-WORLD: mesa mate #080808, fotografía editorial oscura, paneles contenidos y #DDF527 reservado para acción y selección.
STORY: el visitante entiende la oferta, observa el flujo, reconoce formatos posibles y llega a una invitación de acceso anticipado.
FIRST VIEWPORT: navegación compacta y mensaje centrado sobre una cinta tenue de pruebas visuales; el CTA queda visible sin desplazarse.
FORM: landing Persuade de variación 6, movimiento 3 y densidad 4; combina demostración, bento visual y lectura editorial.
*/
export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <ProductPreview />
        <ContentTypesSection />
        <HowItWorksSection />
        <PricingSection />
        <ExamplesSection />
        <ComparisonSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  );
}
