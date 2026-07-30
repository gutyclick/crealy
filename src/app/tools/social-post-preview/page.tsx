import { Container } from "@/components/layout/container";
import { SocialPostPreviewClient } from "@/components/tools/social-post-preview-client";
import { ToolCta } from "@/components/tools/tool-cta";
import { ToolFaq, type ToolFaqItem } from "@/components/tools/tool-faq";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { ToolStructuredData } from "@/components/tools/tool-structured-data";
import { createToolMetadata } from "@/lib/tools/create-tool-metadata";

const faq = [
  {
    question: "¿Qué redes puedo simular?",
    answer:
      "Instagram cuadrado y vertical, X, LinkedIn y Facebook, con proporciones y medidas recomendadas.",
  },
  {
    question: "¿La interfaz será idéntica a la red social?",
    answer:
      "No. Es una simulación de contexto y recorte; cada plataforma puede cambiar su interfaz.",
  },
] satisfies ToolFaqItem[];

export const metadata = createToolMetadata({
  title: "Vista previa de posts para redes sociales",
  description:
    "Simula tu publicación en Instagram, X, LinkedIn y Facebook antes de compartirla.",
  path: "/tools/social-post-preview",
});

export default function Page() {
  return (
    <>
      <ToolPageHeader
        title="Comprueba el post antes de verlo publicado."
        description="Ajusta texto, formato y recorte en una simulación clara de las principales redes."
      />
      <Container className="py-10 sm:py-14">
        <SocialPostPreviewClient />
      </Container>
      <ToolCta />
      <ToolFaq items={faq} />
      <ToolStructuredData
        name="Vista previa de posts para redes sociales"
        description={metadata.description as string}
        path="/tools/social-post-preview"
        faq={faq}
      />
    </>
  );
}
