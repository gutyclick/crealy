import { LegalPage } from "@/components/legal/legal-page";
import { createMetadata } from "@/lib/seo/create-metadata";

export const metadata = createMetadata({
  title: "Términos de servicio",
  description: "Condiciones provisionales para usar Crealy.",
  path: "/terms",
  index: process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === "true",
});

const sections = [
  {
    title: "Cuenta y elegibilidad",
    paragraphs: [
      "Debes proporcionar información válida, proteger tus credenciales y utilizar una sola cuenta personal salvo autorización. La edad mínima y capacidad legal aplicables quedan pendientes de revisión jurídica.",
      "Durante una beta, el acceso puede limitarse, requerir invitación o modificarse para proteger la estabilidad.",
    ],
  },
  {
    title: "Créditos, suscripciones y renovación",
    paragraphs: [
      "Las operaciones muestran un coste en créditos. Una reserva puede aplicarse al iniciar y liberarse si el trabajo falla. Los créditos mensuales y de bienvenida siguen las reglas visibles en producto.",
      "Las suscripciones se procesan con Stripe y pueden renovarse hasta su cancelación. El portal de facturación permite administrar el plan cuando está habilitado.",
    ],
  },
  {
    title: "Tu contenido y resultados",
    paragraphs: [
      "Debes tener los derechos y permisos necesarios sobre imágenes, marcas, rostros, textos y referencias que subes. Otorgas a Crealy la licencia técnica limitada necesaria para procesarlos, almacenarlos y entregarte el servicio.",
      "Los resultados de sistemas generativos pueden no ser únicos, exactos ni aptos para cualquier uso. No garantizamos propiedad exclusiva cuando la ley o las políticas aplicables no la reconozcan.",
    ],
  },
  {
    title: "Disponibilidad y cambios",
    paragraphs: [
      "Crealy puede limitar temporalmente generación, edición, billing o herramientas por mantenimiento, proveedores, presupuesto o seguridad, procurando mantener historial y descargas cuando sea posible.",
      "El producto puede cambiar durante la beta. No se promete disponibilidad perfecta ni continuidad de una función experimental.",
    ],
  },
  {
    title: "Suspensión, terminación y responsabilidad",
    paragraphs: [
      "Podemos limitar o suspender cuentas por incumplimiento, fraude, abuso, riesgo de seguridad o perjuicio a la infraestructura. El usuario puede cancelar su suscripción y solicitar cierre de cuenta.",
      "Los límites de responsabilidad, exclusiones permitidas, ley aplicable y mecanismo de disputas deben ser definidos por asesoría legal y normativa obligatoria.",
    ],
  },
] as const;

export default function TermsPage() {
  return (
    <LegalPage
      title="Términos de servicio"
      summary="Define las reglas provisionales de cuenta, créditos, suscripción, contenido y disponibilidad."
      effectiveDate={process.env.NEXT_PUBLIC_TERMS_EFFECTIVE_DATE}
      sections={sections}
    />
  );
}
