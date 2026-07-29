import type { Metadata } from "next";

import { GenerationForm } from "@/components/generation/generation-form";
import { Container } from "@/components/layout/container";
import { isGenerationAvailable } from "@/lib/env/server";

/*
THESIS: Crear debe sentirse como dirigir una pieza visual, no operar un panel técnico.
OWN-WORLD: estudio mate de producción; controles compactos, lienzo dominante y lima reservado para decisiones activas.
STORY: la persona elige el destino, describe la idea, calibra el estilo y recibe una imagen descargable sin cambiar de contexto.
FIRST VIEWPORT: brief secuencial a la izquierda y resultado persistente a la derecha; en móvil, intención antes que resultado.
FORM: híbrido de las composiciones A y C, sin stepper artificial; formulario continuo + canvas sticky.
*/

export const metadata: Metadata = {
  title: "Crear",
  description: "Genera una nueva pieza visual con Crealy.",
};

export default function CreatePage() {
  return (
    <main className="py-6 sm:py-10">
      <Container>
        <GenerationForm available={isGenerationAvailable()} />
      </Container>
    </main>
  );
}
