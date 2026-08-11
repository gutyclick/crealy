import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_EFFECTIVE_DATE } from "@/config/legal";
import { createMetadata } from "@/lib/seo/create-metadata";

export const metadata = createMetadata({
  title: "Términos de servicio",
  description: "Condiciones aplicables al uso de Crealy y sus servicios de creación visual con IA.",
  path: "/terms",
  index: process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === "true",
});

const sections = [
  {
    title: "1. Operador y aceptación",
    paragraphs: [
      "Crealy es un servicio operado por YellowCat Enterprises LLC, sociedad constituida en Nuevo México, Estados Unidos, con domicilio de contacto en Vía Ricardo J. Alfaro, Edificio Century Tower, Oficina 621, Ciudad de Panamá, Panamá.",
      "Al crear una cuenta o utilizar Crealy aceptas estos Términos, la Política de privacidad, la Política de uso aceptable y las condiciones comerciales mostradas antes de cada compra. Si no estás de acuerdo, no utilices el servicio.",
    ],
  },
  {
    title: "2. Edad, cuenta y seguridad",
    paragraphs: [
      "Debes tener al menos 16 años. Si en tu jurisdicción todavía no tienes capacidad para contratar, debes contar con autorización válida de tu madre, padre o representante legal.",
      "Debes proporcionar información exacta, mantener seguras tus credenciales y notificarnos cualquier acceso no autorizado. No puedes compartir, vender ni automatizar cuentas para eludir límites, créditos o controles de seguridad.",
    ],
  },
  {
    title: "3. Servicio de inteligencia artificial",
    paragraphs: [
      "Crealy permite generar, recrear, editar, analizar y previsualizar piezas visuales mediante sistemas de inteligencia artificial y herramientas auxiliares. Algunas operaciones se ejecutan en cola y dependen de proveedores externos.",
      "La IA puede producir errores, texto imperfecto, resultados inesperados o similitudes accidentales. La calidad depende, entre otros factores, de la claridad del brief y de las referencias aportadas. Debes revisar cada resultado antes de publicarlo o utilizarlo profesionalmente.",
    ],
  },
  {
    title: "4. Planes, renovación y cancelación",
    paragraphs: [
      "Los precios, impuestos, periodo mensual o anual, créditos incluidos y fecha de renovación se muestran antes del pago. Las suscripciones se procesan mediante Stripe y se renuevan automáticamente hasta que las canceles.",
      "Puedes cancelar desde el portal de facturación. La cancelación impide cobros posteriores y conserva el acceso contratado hasta finalizar el periodo ya pagado, salvo suspensión por fraude, abuso o incumplimiento grave.",
      "Creator y Pro reciben prioridad de procesamiento frente a Free y Starter. También pueden acceder a soporte prioritario por Discord, sujeto a disponibilidad y horario operativo, sin un tiempo de respuesta garantizado salvo acuerdo escrito distinto.",
    ],
  },
  {
    title: "5. Créditos",
    paragraphs: [
      "Cada operación muestra o aplica un coste en créditos. Crealy puede reservar créditos al iniciar un trabajo, consumirlos cuando finaliza y liberarlos cuando el procesamiento falla de forma atribuible al servicio.",
      "Los créditos incluidos en una suscripción se renuevan con cada cobro y no se acumulan entre ciclos: el saldo de plan no utilizado se sustituye por la asignación del nuevo periodo. Si cancelas o el siguiente cobro no se completa, no recibes una nueva asignación y conservas el saldo restante ya otorgado. Los créditos adquiridos separadamente en paquetes se acumulan y no vencen, salvo que la oferta indique expresamente otra condición antes de la compra.",
      "Los créditos no son dinero, no pueden transferirse entre cuentas ni canjearse por efectivo. Podemos corregir saldos derivados de errores técnicos, contracargos, fraude o duplicidades verificadas.",
    ],
  },
  {
    title: "6. Tu contenido y tus resultados",
    paragraphs: [
      "Conservas el 100 % de los derechos que tengas sobre tus archivos y, frente a Crealy, sobre los resultados generados para ti. Crealy no reclama propiedad sobre ellos. Esta asignación no garantiza exclusividad ni crea derechos que la legislación aplicable o los derechos de terceros no permitan reconocer.",
      "Nos otorgas una licencia limitada, mundial y temporal para alojar, copiar, transformar y transmitir tus archivos, prompts y resultados únicamente en la medida necesaria para prestar, proteger y mantener el servicio.",
      "Garantizas que tienes los derechos, permisos y bases legales necesarios sobre imágenes, rostros, voces, marcas, textos y demás referencias que proporciones. Eres responsable de revisar el uso comercial, publicitario o regulado de los resultados.",
    ],
  },
  {
    title: "7. Conservación y descarga",
    paragraphs: [
      "Los archivos originales y referencias subidos se programan para eliminación a los 7 días. Las creaciones se conservan durante 7 días en Free y Starter, 30 días en Creator y 90 días en Pro.",
      "Debes descargar los archivos que quieras conservar. Podemos mantener metadatos, registros de facturación, consentimiento, seguridad y auditoría durante plazos distintos cuando sean necesarios para cumplir obligaciones o resolver disputas.",
    ],
  },
  {
    title: "8. Disponibilidad, cambios y suspensión",
    paragraphs: [
      "Podemos mantener, modificar o retirar funciones, límites y modelos para mejorar seguridad, cumplimiento, coste o calidad. Cuando un cambio material afecte derechos o una suscripción activa, procuraremos comunicarlo con antelación razonable.",
      "Podemos rechazar contenido o limitar, suspender o cerrar una cuenta por fraude, abuso, riesgo de seguridad, infracción de derechos o incumplimiento de estos Términos. Cuando sea razonable, daremos oportunidad de corregir antes del cierre.",
    ],
  },
  {
    title: "9. Garantías y responsabilidad",
    paragraphs: [
      "Crealy se presta según disponibilidad. No garantizamos que un resultado sea único, exacto, libre de errores o adecuado para una finalidad concreta. Nada de lo aquí dispuesto excluye responsabilidad que legalmente no pueda limitarse, incluidos los derechos imperativos de consumidores.",
      "En la máxima medida permitida, no respondemos por daños indirectos, pérdida de oportunidades o decisiones tomadas sin revisar los resultados. Nuestra responsabilidad contractual agregada se limitará al importe pagado por el usuario durante los 12 meses anteriores al hecho, salvo que la ley aplicable exija un límite diferente.",
    ],
  },
  {
    title: "10. Ley aplicable y controversias",
    paragraphs: [
      "Estos Términos se rigen con carácter general por las leyes de la República de Panamá y las controversias se someterán a los tribunales competentes de Ciudad de Panamá, después de intentar una solución de buena fe escribiendo a hola@crealy.app.",
      "Esta elección no priva a consumidores de España, México, Colombia u otros países de las protecciones obligatorias ni de los foros que no puedan excluirse por contrato en su lugar de residencia.",
    ],
  },
] as const;

export default function TermsPage() {
  return <LegalPage title="Términos de servicio" summary="Reglas de cuenta, suscripción, créditos, contenido y uso de la inteligencia artificial en Crealy." effectiveDate={LEGAL_EFFECTIVE_DATE} sections={sections} />;
}
