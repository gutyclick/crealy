import type { Metadata } from "next";

import { GenerationForm } from "@/components/generation/generation-form";
import { Container } from "@/components/layout/container";
import {
  getEditingServerEnv,
  isGenerationAvailable,
} from "@/lib/env/server";
import type { ContentType } from "@/types/generation";

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

const CONTENT_TYPES = new Set<ContentType>([
  "youtube-thumbnail",
  "social-post",
  "banner",
  "social-cover",
]);

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const requestedType = (await searchParams).type;
  const initialContentType =
    requestedType && CONTENT_TYPES.has(requestedType as ContentType)
      ? (requestedType as ContentType)
      : undefined;
  let maxReferenceFileMb = 10;
  try {
    maxReferenceFileMb =
      getEditingServerEnv().maxReferenceImageBytes / 1024 / 1024;
  } catch {
    // Keep safe client guidance when environment configuration is incomplete.
  }

  return (
    <main className="py-6 sm:py-10">
      <Container>
        <GenerationForm
          available={isGenerationAvailable()}
          maxReferenceFileMb={maxReferenceFileMb}
          initialContentType={initialContentType}
        />
      </Container>
    </main>
  );
}
