import { LegalPage } from "@/components/legal/legal-page";
import { createMetadata } from "@/lib/seo/create-metadata";

export const metadata = createMetadata({
  title: "Política de uso aceptable",
  description: "Usos permitidos y prohibidos en Crealy.",
  path: "/acceptable-use",
  index: process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === "true",
});

const sections = [
  {
    title: "Usa Crealy de forma responsable",
    paragraphs: [
      "No puedes utilizar el servicio para causar daño, vulnerar derechos, engañar de manera ilícita ni interferir con la operación de Crealy o sus proveedores.",
    ],
    items: [
      "Actividad ilegal, fraude, suplantación engañosa o documentos falsos.",
      "Acoso, explotación sexual, abuso sexual infantil o violencia extrema.",
      "Infracción de propiedad intelectual, privacidad, imagen o marcas.",
      "Malware, spam, automatización abusiva, evasión de controles o pruebas no autorizadas.",
      "Reventa no autorizada, scraping intensivo o uso que perjudique la infraestructura.",
    ],
  },
  {
    title: "Contenido sensible y referencias",
    paragraphs: [
      "No subas contenido sobre el que no tengas autorización. Las imágenes de personas deben utilizarse con base legítima y sin crear engaños, acoso o perjuicio.",
      "Crealy puede rechazar solicitudes, limitar el acceso o conservar evidencia mínima de seguridad cuando sea necesario investigar abuso.",
    ],
  },
  {
    title: "Aplicación",
    paragraphs: [
      "La respuesta puede incluir advertencia, limitación, suspensión o cierre según gravedad y recurrencia. Los casos de riesgo inmediato pueden escalarse conforme a la ley aplicable.",
    ],
  },
] as const;

export default function AcceptableUsePage() {
  return (
    <LegalPage
      title="Política de uso aceptable"
      summary="Establece límites claros para proteger a usuarios, terceros y la infraestructura."
      sections={sections}
    />
  );
}
