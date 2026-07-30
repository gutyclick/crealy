import { LegalPage } from "@/components/legal/legal-page";
import { createMetadata } from "@/lib/seo/create-metadata";

export const metadata = createMetadata({
  title: "Política de reembolsos",
  description: "Criterios provisionales para cancelaciones y reembolsos de Crealy.",
  path: "/refund-policy",
  index: process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === "true",
});

const sections = [
  {
    title: "Suscripciones y cancelación",
    paragraphs: [
      "Cuando billing está habilitado, la suscripción se renueva según el periodo indicado por Stripe hasta que la canceles. La cancelación evita renovaciones futuras y normalmente conserva acceso hasta terminar el ciclo pagado.",
      "Crealy no ofrece actualmente un plan anual ni automatiza reembolsos desde la aplicación.",
    ],
  },
  {
    title: "Solicitudes de reembolso",
    paragraphs: [
      "Los créditos ya consumidos representan procesamiento realizado y no se reembolsan automáticamente. Revisaremos cobros duplicados, fallos técnicos verificables y situaciones exigidas por la ley aplicable.",
      "El plazo comercial definitivo para solicitar revisión está pendiente. Hasta validarlo, contacta a soporte lo antes posible e incluye una referencia de operación, nunca datos completos de tarjeta.",
    ],
  },
  {
    title: "Decisiones pendientes",
    paragraphs: [
      "La elegibilidad, plazo, método de devolución, impuestos y derechos obligatorios del consumidor deben adaptarse a la entidad, país de venta y configuración live de Stripe antes del lanzamiento público.",
    ],
  },
] as const;

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Política de reembolsos"
      summary="Explica cómo se revisan cancelaciones, créditos consumidos, fallos y cobros duplicados."
      sections={sections}
    />
  );
}
