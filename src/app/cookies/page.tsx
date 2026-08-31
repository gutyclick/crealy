import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_EFFECTIVE_DATE } from "@/config/legal";
import { createMetadata } from "@/lib/seo/create-metadata";
import { GoogleAdsConsentControls } from "@/components/analytics/google-ads-provider";

export const metadata = createMetadata({ title: "Política de cookies", description: "Cookies, almacenamiento local, analítica y controles utilizados por Crealy.", path: "/cookies", index: process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === "true" });

const sections = [
  { title: "1. Qué son estas tecnologías", paragraphs: ["Las cookies son pequeños datos que un sitio guarda o lee en el navegador. Crealy también utiliza almacenamiento local para conservar preferencias y notificaciones del dispositivo. Algunas tecnologías son imprescindibles para que el área privada funcione; otras permiten medir rendimiento y uso general."] },
  { title: "2. Cookies estrictamente necesarias", paragraphs: ["Supabase utiliza cookies de sesión para iniciar sesión, renovar la autenticación y proteger rutas privadas. Crealy utiliza cookies temporales para confirmación de correo, recuperación de contraseña, MFA, OAuth e invitaciones. Estas cookies no se usan para publicidad y no pueden desactivarse desde Crealy sin impedir funciones esenciales."] },
  { title: "3. Almacenamiento local", paragraphs: ["El centro de notificaciones de creación utiliza almacenamiento local para recordar avisos vistos y la preferencia de sonido en ese navegador. Borrar los datos del sitio elimina esas preferencias, pero no borra proyectos ni información de cuenta almacenada en el servidor."] },
  { title: "4. Analítica, publicidad, rendimiento y errores", paragraphs: ["Cuando las variables correspondientes están habilitadas, Vercel Analytics y Speed Insights miden visitas, navegación y rendimiento. Sentry recibe errores, trazas y métricas técnicas con la transmisión de información personal predeterminada desactivada.", "Con tu consentimiento, Google Tag Manager administra la carga de la etiqueta de Google Ads, que mide visitas y conversiones para que podamos evaluar campañas publicitarias. Puede tratar identificadores técnicos, información del navegador, páginas visitadas y la confirmación de una conversión. No enviamos a Google prompts, imágenes, correos, datos completos de pago, URLs firmadas ni mensajes de soporte."] },
  { title: "5. Consentimiento y controles", paragraphs: ["Google Ads permanece desactivado hasta que aceptas la medición. Puedes aceptarla o rechazarla con la misma facilidad y retirar tu consentimiento en cualquier momento mediante los controles disponibles en esta página. La retirada no afecta el tratamiento realizado previamente.", "La suscripción opcional a novedades es independiente de las cookies y permanece desmarcada por defecto. Puedes darte de baja en cualquier momento sin dejar de recibir comunicaciones necesarias de seguridad, soporte o facturación."] },
  { title: "6. Cambios", paragraphs: ["Actualizaremos esta política si incorporamos nuevos proveedores, finalidades o tecnologías. Los cambios materiales que requieran consentimiento no se aplicarán como si hubieran sido aceptados previamente."] },
] as const;

export default function CookiesPage() {
  return <LegalPage title="Política de cookies" summary="Describe las tecnologías necesarias, el almacenamiento local y la medición técnica de Crealy." effectiveDate={LEGAL_EFFECTIVE_DATE} sections={sections}><GoogleAdsConsentControls /></LegalPage>;
}
