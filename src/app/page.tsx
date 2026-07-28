import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { HeroSection } from "@/components/sections/hero-section";

/*
THESIS: Crealy convierte una intención breve en piezas visuales; rechaza el hero IA que solo promete sin mostrar el flujo.
OWN-WORLD: mesa mate #080808, pruebas abstractas oscuras y #DDF527 como señal única de acción y selección.
STORY: el visitante entiende qué es Crealy, observa una demostración provisional y encuentra una acción clara.
FIRST VIEWPORT: navegación y mensaje centrados sobre dos filas lentas de miniaturas; la mesa del producto emerge debajo.
FORM: landing Persuade centrada, elegida por el brief; demostración horizontal con contenido mínimo y movimiento ambiental.
*/
export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
      </main>
      <Footer />
    </>
  );
}
