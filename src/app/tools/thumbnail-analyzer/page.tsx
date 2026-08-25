import { Container } from "@/components/layout/container";
import { ThumbnailAnalyzerClient } from "@/components/tools/thumbnail-analyzer-client";
import { ToolCta } from "@/components/tools/tool-cta";
import { ToolFaq, type ToolFaqItem } from "@/components/tools/tool-faq";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { ToolStructuredData } from "@/components/tools/tool-structured-data";
import { createToolMetadata } from "@/lib/tools/create-tool-metadata";

const faq = [
  {
    question: "¿Qué evalúa el analizador?",
    answer:
      "Composición, legibilidad, jerarquía, contraste, claridad a tamaño pequeño y foco visual.",
  },
  {
    question: "¿Puede predecir el rendimiento de una miniatura?",
    answer:
      "No. El resultado es una crítica visual orientativa, no una predicción de CTR, visitas o conversiones.",
  },
  {
    question: "¿Cuánto cuesta?",
    answer:
      "El primer análisis diario es gratuito. A partir de ahí, cada análisis usa un crédito, sujeto al límite diario.",
  },
] satisfies ToolFaqItem[];

export const metadata = createToolMetadata({
  title: "Analizador avanzado de miniaturas",
  description:
    "Obtén una crítica visual estructurada de tu miniatura con acciones concretas para mejorarla.",
  path: "/tools/thumbnail-analyzer",
});

export default function Page() {
  return (
    <>
      <ToolPageHeader
        title="Una segunda mirada, antes de publicar."
        description="Recibe una lectura estructurada de composición, texto, jerarquía, contraste y claridad."
        usesAI
        requiresAuth
      />
      <Container className="py-10 sm:py-14">
        <ThumbnailAnalyzerClient />
      </Container>
      <ToolCta
        title="Convierte las mejoras en una nueva versión."
        description="Crea una miniatura nueva o edita la actual mediante instrucciones sencillas."
      />
      <ToolFaq items={faq} />
      <ToolStructuredData
        name="Analizador avanzado de miniaturas"
        description={metadata.description as string}
        path="/tools/thumbnail-analyzer"
        faq={faq}
      />
    </>
  );
}
