import { LegalPage } from "@/components/legal/legal-page";
import { createMetadata } from "@/lib/seo/create-metadata";

export const metadata = createMetadata({
  title: "Política de cookies",
  description: "Información provisional sobre cookies y medición en Crealy.",
  path: "/cookies",
  index: process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === "true",
});

const sections = [
  {
    title: "Cookies esenciales",
    paragraphs: [
      "Crealy utiliza cookies necesarias para autenticación, renovación de sesión, recuperación de contraseña, seguridad y preferencias operativas. Sin ellas, el área privada no funciona correctamente.",
      "Los tokens de Supabase se gestionan mediante sus librerías de servidor y no se almacenan manualmente en cookies de analítica.",
    ],
  },
  {
    title: "Analítica",
    paragraphs: [
      "Vercel Web Analytics y Speed Insights permanecen detrás de variables de configuración. No deben recibir prompts, imágenes, correos, IDs financieros, URLs firmadas ni contenido de soporte.",
      "La necesidad de consentimiento depende de la configuración efectiva, jurisdicción y tecnología final. Antes de habilitar cualquier script no esencial se realizará la revisión correspondiente.",
    ],
  },
  {
    title: "Marketing y preferencias",
    paragraphs: [
      "Crealy no configura actualmente cookies de marketing ni activa correos promocionales por defecto. Si se añadieran tecnologías no esenciales, se ofrecerán controles para aceptar, rechazar y cambiar la decisión sin patrones engañosos.",
    ],
  },
] as const;

export default function CookiesPage() {
  return (
    <LegalPage
      title="Política de cookies"
      summary="Distingue las cookies necesarias de cualquier medición opcional y explica los controles previstos."
      sections={sections}
    />
  );
}
