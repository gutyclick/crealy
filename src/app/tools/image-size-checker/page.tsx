import { Container } from "@/components/layout/container";
import { ImageSizeCheckerClient } from "@/components/tools/image-size-checker-client";
import { ToolCta } from "@/components/tools/tool-cta";
import { ToolFaq, type ToolFaqItem } from "@/components/tools/tool-faq";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { ToolStructuredData } from "@/components/tools/tool-structured-data";
import { createToolMetadata } from "@/lib/tools/create-tool-metadata";

const faq = [
  {
    question: "¿Qué datos puedo comprobar?",
    answer:
      "Dimensiones en píxeles, proporción, formato y peso del archivo.",
  },
  {
    question: "¿La imagen abandona mi dispositivo?",
    answer:
      "No. El archivo se inspecciona de forma local en tu navegador.",
  },
] satisfies ToolFaqItem[];

export const metadata = createToolMetadata({
  title: "Comprobar tamaño de una imagen",
  description:
    "Consulta dimensiones, proporción, formato y peso de una imagen sin subirla.",
  path: "/tools/image-size-checker",
});

export default function Page() {
  return (
    <>
      <ToolPageHeader
        title="Conoce las medidas reales de tu imagen."
        description="Una comprobación rápida y privada de dimensiones, proporción, formato y peso."
      />
      <Container className="py-10 sm:py-14">
        <ImageSizeCheckerClient />
      </Container>
      <ToolCta />
      <ToolFaq items={faq} />
      <ToolStructuredData
        name="Comprobar tamaño de una imagen"
        description={metadata.description as string}
        path="/tools/image-size-checker"
        faq={faq}
      />
    </>
  );
}
