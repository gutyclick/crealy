import { Container } from "@/components/layout/container";
import { ThumbnailComparatorClient } from "@/components/tools/thumbnail-comparator-client";
import { ToolCta } from "@/components/tools/tool-cta";
import { ToolFaq, type ToolFaqItem } from "@/components/tools/tool-faq";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { ToolStructuredData } from "@/components/tools/tool-structured-data";
import { createToolMetadata } from "@/lib/tools/create-tool-metadata";

const faq = [
  {
    question: "¿Cuántas miniaturas puedo comparar?",
    answer: "Puedes colocar dos o tres opciones lado a lado.",
  },
  {
    question: "¿Crealy elige una ganadora?",
    answer:
      "No. Esta comparación gratuita evita afirmar un CTR; te ayuda a revisar diferencias y claridad a tamaño reducido.",
  },
] satisfies ToolFaqItem[];

export const metadata = createToolMetadata({
  title: "Comparador de miniaturas de YouTube",
  description:
    "Compara entre dos y tres miniaturas en tamaño normal y reducido sin subirlas.",
  path: "/tools/thumbnail-comparator",
});

export default function Page() {
  return (
    <>
      <ToolPageHeader
        title="Compara opciones sin perder la perspectiva."
        description="Pon tus variantes lado a lado y comprueba cuál conserva mejor su idea a tamaño reducido."
      />
      <Container className="py-10 sm:py-14">
        <ThumbnailComparatorClient />
      </Container>
      <ToolCta />
      <ToolFaq items={faq} />
      <ToolStructuredData
        name="Comparador de miniaturas de YouTube"
        description={metadata.description as string}
        path="/tools/thumbnail-comparator"
        faq={faq}
      />
    </>
  );
}
