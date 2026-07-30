import { Container } from "@/components/layout/container";
import { SafeAreaCheckerClient } from "@/components/tools/safe-area-checker-client";
import { ToolCta } from "@/components/tools/tool-cta";
import { ToolFaq, type ToolFaqItem } from "@/components/tools/tool-faq";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { ToolStructuredData } from "@/components/tools/tool-structured-data";
import { createToolMetadata } from "@/lib/tools/create-tool-metadata";

const faq = [
  {
    question: "¿Qué es una zona segura?",
    answer:
      "Es el área donde conviene mantener textos, logos y rostros para reducir el riesgo de que un recorte los oculte.",
  },
  {
    question: "¿Puedo descargar las guías?",
    answer:
      "Sí. Cada plataforma incluye una plantilla SVG transparente para usar en tu editor.",
  },
] satisfies ToolFaqItem[];

export const metadata = createToolMetadata({
  title: "Comprobar zonas seguras para portadas",
  description:
    "Superpone y descarga zonas seguras para YouTube, X, LinkedIn y Facebook.",
  path: "/tools/safe-area-checker",
});

export default function Page() {
  return (
    <>
      <ToolPageHeader
        title="Mantén lo importante dentro del encuadre."
        description="Superpone guías de YouTube, X, LinkedIn y Facebook y descarga una plantilla transparente."
      />
      <Container className="py-10 sm:py-14">
        <SafeAreaCheckerClient />
      </Container>
      <ToolCta />
      <ToolFaq items={faq} />
      <ToolStructuredData
        name="Comprobar zonas seguras para portadas"
        description={metadata.description as string}
        path="/tools/safe-area-checker"
        faq={faq}
      />
    </>
  );
}
