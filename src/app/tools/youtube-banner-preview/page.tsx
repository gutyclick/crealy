import { Container } from "@/components/layout/container";
import { ToolCta } from "@/components/tools/tool-cta";
import { ToolFaq, type ToolFaqItem } from "@/components/tools/tool-faq";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { ToolStructuredData } from "@/components/tools/tool-structured-data";
import { YoutubeBannerPreviewClient } from "@/components/tools/youtube-banner-preview-client";
import { createToolMetadata } from "@/lib/tools/create-tool-metadata";

const faq = [
  {
    question: "¿Qué tamaño debe tener un banner de YouTube?",
    answer:
      "La medida de trabajo recomendada es 2560 × 1440 px. Conserva el contenido esencial en el área central.",
  },
  {
    question: "¿Los recortes son exactos?",
    answer:
      "Son aproximaciones útiles. YouTube puede ajustar la vista según dispositivo, interfaz y densidad de pantalla.",
  },
] satisfies ToolFaqItem[];

export const metadata = createToolMetadata({
  title: "Vista previa de banners de YouTube",
  description:
    "Revisa un banner de YouTube en TV, escritorio, tableta y móvil con su zona segura.",
  path: "/tools/youtube-banner-preview",
});

export default function Page() {
  return (
    <>
      <ToolPageHeader
        title="Un banner, cuatro formas de verlo."
        description="Comprueba los recortes y mantén textos, rostros y logos dentro de la zona que importa."
      />
      <Container className="py-10 sm:py-14">
        <YoutubeBannerPreviewClient />
      </Container>
      <ToolCta />
      <ToolFaq items={faq} />
      <ToolStructuredData
        name="Vista previa de banners de YouTube"
        description={metadata.description as string}
        path="/tools/youtube-banner-preview"
        faq={faq}
      />
    </>
  );
}
