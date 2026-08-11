import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_EFFECTIVE_DATE } from "@/config/legal";
import { createMetadata } from "@/lib/seo/create-metadata";

export const metadata = createMetadata({ title: "Política de reembolsos", description: "Cancelaciones, desistimiento, fallos y reembolsos de Crealy.", path: "/refund-policy", index: process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === "true" });

const sections = [
  { title: "1. Cancelación", paragraphs: ["Puedes cancelar una suscripción desde el portal de Stripe. La cancelación evita la siguiente renovación y conserva el acceso hasta finalizar el periodo pagado. No se cobran penalidades por cancelar.", "El saldo restante ya otorgado permanece en la cuenta, pero no recibirás una nueva asignación si la suscripción no se renueva. Los créditos de suscripción no se acumulan en una renovación; los paquetes comprados por separado sí se acumulan conforme a su oferta."] },
  { title: "2. Garantía comercial de 7 días", paragraphs: ["Además de los derechos obligatorios que te correspondan, puedes solicitar un reembolso dentro de los 7 días siguientes al primer cobro de una suscripción si has consumido como máximo 10 créditos durante ese periodo.", "La garantía comercial no aplica a renovaciones, paquetes de créditos ya utilizados, cuentas suspendidas por fraude o abuso, ni resultados que simplemente no coincidan con una expectativa subjetiva cuando el servicio procesó correctamente la solicitud. Un brief poco detallado puede producir resultados menos precisos y no genera por sí solo devolución de créditos."] },
  { title: "3. Fallos técnicos y cobros incorrectos", paragraphs: ["Si una generación falla antes de completarse por una causa atribuible a Crealy, la reserva de créditos debe liberarse o restituirse. Revisaremos cobros duplicados, importes incorrectos, imposibilidad persistente de acceder al servicio y fallos verificables.", "No envíes números completos de tarjeta. Para solicitar revisión escribe a hola@crealy.app desde el correo de tu cuenta e incluye fecha, plan, referencia y explicación."] },
  { title: "4. Desistimiento y suministro inmediato", paragraphs: ["Antes de abrir Stripe solicitamos que autorices expresamente el inicio inmediato del servicio digital y reconozcas las consecuencias que la ley aplicable pueda atribuir al suministro o consumo. Conservamos evidencia de esa decisión y enviamos confirmación de la activación.", "En España y otros lugares pueden existir derechos de desistimiento de 14 días u otros derechos irrenunciables. La garantía comercial de 7 días no los sustituye. El alcance de una renuncia, reducción o compensación por servicio ya prestado dependerá del tipo de prestación, del consentimiento recogido y de la ley aplicable."] },
  { title: "5. Método y plazo", paragraphs: ["Cuando aprobemos un reembolso, lo enviaremos normalmente al método de pago original. Stripe y la entidad financiera determinan el tiempo de reflejo. Impuestos, conversiones y comisiones externas se tratarán conforme a la ley y a las reglas del proveedor de pago."] },
] as const;

export default function RefundPolicyPage() {
  return <LegalPage title="Política de reembolsos" summary="Condiciones comerciales de cancelación y reembolso, sin limitar los derechos obligatorios del consumidor." effectiveDate={LEGAL_EFFECTIVE_DATE} sections={sections} />;
}
