import { Container } from "@/components/layout/container";
import { ToolCta } from "@/components/tools/tool-cta";
import { ToolFaq, type ToolFaqItem } from "@/components/tools/tool-faq";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { ToolStructuredData } from "@/components/tools/tool-structured-data";
import { YoutubeThumbnailDownloaderClient } from "@/components/tools/youtube-thumbnail-downloader-client";
import { createToolMetadata } from "@/lib/tools/create-tool-metadata";

const faq = [
  {
    question: "¿Qué enlaces admite?",
    answer:
      "Enlaces normales de YouTube, youtu.be, Shorts y videos incrustados.",
  },
  {
    question: "¿Crealy descarga el video?",
    answer:
      "No. Solo consulta las variantes públicas de miniatura que entrega el CDN de YouTube.",
  },
] satisfies ToolFaqItem[];

export const metadata = createToolMetadata({
  title: "Descargar miniaturas de YouTube",
  description:
    "Encuentra y descarga las variantes públicas disponibles de una miniatura de YouTube.",
  path: "/tools/youtube-thumbnail-downloader",
});

export default function Page() {
  return (
    <>
      <ToolPageHeader
        title="Encuentra la mejor versión disponible."
        description="Pega una URL de YouTube y descarga únicamente las variantes públicas que realmente existen."
      />
      <Container className="py-10 sm:py-14">
        <YoutubeThumbnailDownloaderClient />
      </Container>
      <ToolCta />
      <ToolFaq items={faq} />
      <ToolStructuredData
        name="Descargar miniaturas de YouTube"
        description={metadata.description as string}
        path="/tools/youtube-thumbnail-downloader"
        faq={faq}
      />
    </>
  );
}
