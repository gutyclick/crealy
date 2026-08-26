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
import { StartFreeSection } from "@/components/sections/start-free-section";
import { HomeStructuredData } from "@/components/seo/home-structured-data";

/*
THESIS: Crealy convierte una intención en varias piezas listas para publicar y evita la complejidad de un editor generalista.
OWN-WORLD: una mesa de producción oscura, imágenes diversas en movimiento y #DDF527 reservado para acción y selección.
STORY: el visitante entiende la oferta, ve el mecanismo, reconoce usos concretos y termina en una invitación honesta a crear su cuenta.
FIRST VIEWPORT: un estudio visual ocupa todo el fondo; el mensaje centrado conserva una zona de lectura limpia y dos acciones visibles.
FORM: landing Persuade centrada, de variación 7, movimiento 7 y densidad 3; alterna escena, demostración, ritmo editorial y pausa.
*/
export default function Home() {
  return (
    <>
      <HomeStructuredData />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <ProductPreview />
        <PricingSection />
        <ContentTypesSection />
        <ExamplesSection />
        <StartFreeSection />
        <HowItWorksSection />
        <ComparisonSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  );
}
