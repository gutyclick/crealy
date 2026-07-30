import { Container } from "@/components/layout/container";
import { ToolCta } from "@/components/tools/tool-cta";
import { ToolFaq, type ToolFaqItem } from "@/components/tools/tool-faq";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { ToolStructuredData } from "@/components/tools/tool-structured-data";
import { YoutubeThumbnailPreviewClient } from "@/components/tools/youtube-thumbnail-preview-client";
import { createToolMetadata } from "@/lib/tools/create-tool-metadata";

const faq = [
  {
    question: "¿La vista previa predice el CTR?",
    answer:
      "No. Solo simula tamaños y contexto visual para ayudarte a detectar problemas de lectura o composición.",
  },
  {
    question: "¿Mi miniatura se sube a Crealy?",
    answer:
      "No. Esta herramienta lee la imagen directamente en tu navegador.",
  },
] satisfies ToolFaqItem[];

export const metadata = createToolMetadata({
  title: "Vista previa de miniaturas de YouTube",
  description:
    "Comprueba cómo se ve tu miniatura de YouTube en escritorio, móvil, búsqueda y tamaños reducidos.",
  path: "/tools/youtube-thumbnail-preview",
});

export default function Page() {
  return (
    <>
      <ToolPageHeader
        title="Mira tu miniatura como la verá tu audiencia."
        description="Prueba legibilidad, proporción y peso en varias vistas de YouTube antes de publicar."
      />
      <Container className="py-10 sm:py-14">
        <YoutubeThumbnailPreviewClient />
      </Container>
      <ToolCta />
      <ToolFaq items={faq} />
      <ToolStructuredData
        name="Vista previa de miniaturas de YouTube"
        description={metadata.description as string}
        path="/tools/youtube-thumbnail-preview"
        faq={faq}
      />
    </>
  );
}
