import { Container } from "@/components/layout/container";
import { ToolCta } from "@/components/tools/tool-cta";
import { ToolFaq, type ToolFaqItem } from "@/components/tools/tool-faq";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { ToolStructuredData } from "@/components/tools/tool-structured-data";
import { YoutubeBannerDownloaderClient } from "@/components/tools/youtube-banner-downloader-client";
import { createToolMetadata } from "@/lib/tools/create-tool-metadata";

const faq = [
  {
    question: "¿Cómo obtiene Crealy el banner?",
    answer:
      "Consulta el canal mediante YouTube Data API y solo procesa hosts de imagen permitidos.",
  },
  {
    question: "¿Por qué un canal puede no mostrar banner?",
    answer:
      "La API oficial no siempre publica ese recurso. Crealy muestra ese estado sin intentar extraerlo mediante scraping.",
  },
] satisfies ToolFaqItem[];

export const metadata = createToolMetadata({
  title: "Descargar banner de un canal de YouTube",
  description:
    "Consulta y descarga el banner público de un canal mediante YouTube Data API.",
  path: "/tools/youtube-banner-downloader",
});

export default function Page() {
  return (
    <>
      <ToolPageHeader
        title="Consulta el banner público de un canal."
        description="Usamos la API oficial de YouTube, con validación estricta de URLs y sin scraping."
      />
      <Container className="py-10 sm:py-14">
        <YoutubeBannerDownloaderClient />
      </Container>
      <ToolCta />
      <ToolFaq items={faq} />
      <ToolStructuredData
        name="Descargar banner de un canal de YouTube"
        description={metadata.description as string}
        path="/tools/youtube-banner-downloader"
        faq={faq}
      />
    </>
  );
}
