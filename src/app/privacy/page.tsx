import { LegalPage } from "@/components/legal/legal-page";
import { createMetadata } from "@/lib/seo/create-metadata";

export const metadata = createMetadata({
  title: "Política de privacidad",
  description: "Información provisional sobre cómo Crealy trata datos y contenido.",
  path: "/privacy",
  index: process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === "true",
});

const sections = [
  {
    title: "Datos que tratamos",
    paragraphs: [
      "Crealy trata datos de cuenta, preferencias, uso del producto, solicitudes de soporte, información técnica y eventos operativos. También procesa las imágenes, instrucciones y resultados que decides enviar para generar o editar contenido.",
      "No debes incluir contraseñas, claves, datos financieros completos ni información que no tengas derecho a utilizar.",
    ],
  },
  {
    title: "Para qué se utilizan",
    paragraphs: [
      "Los datos se utilizan para autenticarte, prestar generación y edición, administrar créditos y facturación, almacenar archivos, prevenir abuso, resolver errores, responder soporte y mejorar la estabilidad del servicio.",
      "Los eventos de analítica permitidos describen acciones generales y no incluyen prompts, imágenes, correos, claves de almacenamiento ni mensajes de soporte.",
    ],
  },
  {
    title: "Proveedores",
    paragraphs: [
      "La operación actual puede involucrar a Supabase para autenticación y base de datos, OpenAI para generación y edición, Stripe para pagos, Cloudflare R2 o Supabase Storage para archivos, Vercel para alojamiento y observabilidad, y Resend para correos transaccionales.",
      "Cada proveedor procesa únicamente la información necesaria para su función conforme a su configuración y términos aplicables.",
    ],
  },
  {
    title: "Retención y eliminación",
    paragraphs: [
      "Los archivos tienen periodos de retención según su tipo y plan. Algunos se marcan como expirados antes de su eliminación. Los registros de facturación, seguridad y auditoría pueden conservarse durante el tiempo necesario para operar o cumplir obligaciones.",
      "La eliminación de cuenta y la exportación de datos se gestionan inicialmente mediante una solicitud verificada de soporte; no afirmamos una eliminación instantánea.",
    ],
  },
  {
    title: "Cookies, seguridad y transferencias",
    paragraphs: [
      "Se utilizan cookies esenciales de autenticación y seguridad administradas por Supabase. La analítica opcional permanece controlada por configuración y no debe recibir contenido sensible.",
      "Aplicamos controles técnicos y organizativos razonables, pero ningún sistema puede prometer seguridad absoluta. Los proveedores pueden procesar datos en otros países; este punto requiere revisión jurídica según la entidad y usuarios finales.",
    ],
  },
  {
    title: "Tus derechos",
    paragraphs: [
      "Puedes solicitar acceso, corrección, exportación o eliminación según corresponda. También puedes cambiar preferencias opcionales de correo desde la cuenta.",
      "La forma exacta de ejercer derechos, los plazos y la autoridad competente deben completarse tras definir entidad y jurisdicción.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      summary="Explica qué información procesa Crealy, por qué la necesita y qué controles tiene el usuario."
      effectiveDate={process.env.NEXT_PUBLIC_PRIVACY_EFFECTIVE_DATE}
      sections={sections}
    />
  );
}
