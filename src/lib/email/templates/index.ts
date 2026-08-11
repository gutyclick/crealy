export type TransactionalEmailType =
  | "welcome"
  | "generation_ready"
  | "edit_ready"
  | "asset_expiring"
  | "low_credits"
  | "subscription_active"
  | "payment_failed"
  | "support_received"
  | "support_internal";

type TemplateData = Record<string, string | number | boolean | null | undefined>;

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function layout({
  preheader,
  title,
  body,
  ctaLabel,
  ctaUrl,
}: {
  preheader: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  const action =
    ctaLabel && ctaUrl
      ? `<p style="margin:28px 0"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#DDF527;color:#111400;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:10px">${escapeHtml(ctaLabel)}</a></p>`
      : "";
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head><body style="margin:0;background:#080808;color:#F7F7F5;font-family:Arial,sans-serif"><span style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</span><main style="max-width:600px;margin:0 auto;padding:40px 22px"><p style="color:#DDF527;font-weight:800;font-size:20px">Crealy</p><h1 style="font-size:30px;line-height:1.15;margin:30px 0 18px">${escapeHtml(title)}</h1><div style="color:#B0B1AA;font-size:16px;line-height:1.7">${body}</div>${action}<p style="border-top:1px solid #292A25;margin-top:36px;padding-top:20px;color:#7E8078;font-size:12px;line-height:1.6">Este es un correo transaccional de Crealy relacionado con tu cuenta o una solicitud. Consulta nuestra política de privacidad desde el sitio.</p></main></body></html>`;
  const text = `${title}\n\n${body.replace(/<[^>]+>/g, "")}${ctaLabel && ctaUrl ? `\n\n${ctaLabel}: ${ctaUrl}` : ""}\n\nCrealy · Correo transaccional relacionado con tu cuenta.`;
  return { html, text };
}

export function renderEmailTemplate(
  type: TransactionalEmailType,
  data: TemplateData,
) {
  const siteUrl = String(data.siteUrl || "https://www.crealy.app");
  switch (type) {
    case "welcome":
      return {
        subject: "Bienvenido a Crealy",
        preheader: "Tu espacio creativo ya está preparado.",
        ...layout({
          preheader: "Tu espacio creativo ya está preparado.",
          title: "Tu espacio creativo está listo.",
          body:
            "<p>Convierte una idea en miniaturas, portadas y posts, o empieza explorando las herramientas gratuitas.</p>",
          ctaLabel: "Abrir Crealy",
          ctaUrl: `${siteUrl}/dashboard`,
        }),
      };
    case "generation_ready":
      return {
        subject: "Tu creación está lista",
        preheader: "Ya puedes revisar y descargar el resultado.",
        ...layout({
          preheader: "Ya puedes revisar y descargar el resultado.",
          title: "Tu creación está lista.",
          body: "<p>La generación terminó correctamente. Puedes revisarla dentro de tu cuenta.</p>",
          ctaLabel: "Ver en Crealy",
          ctaUrl: String(data.url || `${siteUrl}/generations`),
        }),
      };
    case "edit_ready":
      return {
        subject: "Tu edición está lista",
        preheader: "El cambio solicitado terminó correctamente.",
        ...layout({
          preheader: "El cambio solicitado terminó correctamente.",
          title: "Tu edición está lista.",
          body: "<p>Ya puedes comparar el resultado con las versiones anteriores y continuar editando.</p>",
          ctaLabel: "Ver la edición",
          ctaUrl: String(data.url || `${siteUrl}/edit`),
        }),
      };
    case "asset_expiring":
      return {
        subject: "Una creación se eliminará pronto",
        preheader: "Descárgala o consérvala antes de la fecha indicada.",
        ...layout({
          preheader: "Descárgala o consérvala antes de la fecha indicada.",
          title: "Tu archivo se eliminará pronto.",
          body: `<p><strong style="color:#F7F7F5">${escapeHtml(data.name || "Tu creación")}</strong> está programado para expirar el ${escapeHtml(data.date || "día indicado en tu cuenta")}.</p>`,
          ctaLabel: "Revisar mis archivos",
          ctaUrl: `${siteUrl}/settings/storage`,
        }),
      };
    case "low_credits":
      return {
        subject: "Tus créditos de Crealy están bajos",
        preheader: "Revisa tu saldo antes de la próxima creación.",
        ...layout({
          preheader: "Revisa tu saldo antes de la próxima creación.",
          title: "Te quedan pocos créditos.",
          body: `<p>Tu saldo disponible es de ${escapeHtml(data.credits ?? "")} créditos.</p>`,
          ctaLabel: "Revisar créditos",
          ctaUrl: `${siteUrl}/settings/billing`,
        }),
      };
    case "subscription_active":
      return {
        subject: "Tu plan de Crealy está activo",
        preheader: "La suscripción se sincronizó correctamente.",
        ...layout({
          preheader: "La suscripción se sincronizó correctamente.",
          title: "Tu plan está activo.",
          body: `<p>El plan ${escapeHtml(data.plan || "seleccionado")} ya aparece en tu cuenta.</p><p>Periodo: ${escapeHtml(data.period || "según lo mostrado en Stripe")}.</p><p>Solicitaste la activación inmediata del servicio digital${data.consentAcceptedAt ? ` el ${escapeHtml(data.consentAcceptedAt)}` : ""}. Esta confirmación no limita los derechos irrenunciables que te correspondan como consumidor.</p><p>Consulta los <a href="${escapeHtml(siteUrl)}/terms" style="color:#F7F7F5">Términos</a> y la <a href="${escapeHtml(siteUrl)}/refund-policy" style="color:#F7F7F5">Política de reembolsos</a>.</p>`,
          ctaLabel: "Ver facturación",
          ctaUrl: `${siteUrl}/settings/billing`,
        }),
      };
    case "payment_failed":
      return {
        subject: "No pudimos procesar un pago",
        preheader: "Actualiza el método de pago desde el portal seguro.",
        ...layout({
          preheader: "Actualiza el método de pago desde el portal seguro.",
          title: "Tu pago necesita atención.",
          body: "<p>No pudimos completar el cobro. Tu historial y archivos permanecen disponibles.</p>",
          ctaLabel: "Revisar facturación",
          ctaUrl: `${siteUrl}/settings/billing`,
        }),
      };
    case "support_received":
      return {
        subject: "Recibimos tu solicitud de soporte",
        preheader: "Guardamos tu mensaje y lo revisaremos.",
        ...layout({
          preheader: "Guardamos tu mensaje y lo revisaremos.",
          title: "Tu solicitud quedó registrada.",
          body: `<p>Referencia: <strong style="color:#F7F7F5">${escapeHtml(data.reference || "")}</strong>.</p><p>No necesitas enviarla de nuevo.</p>`,
          ctaLabel: "Volver a Crealy",
          ctaUrl: `${siteUrl}/dashboard`,
        }),
      };
    case "support_internal":
      return {
        subject: `Soporte: ${String(data.category || "Nueva solicitud")}`,
        preheader: "Hay una nueva solicitud de soporte en Crealy.",
        ...layout({
          preheader: "Hay una nueva solicitud de soporte en Crealy.",
          title: "Nueva solicitud de soporte.",
          body: `<p>Categoría: ${escapeHtml(data.category)}</p><p>Asunto: ${escapeHtml(data.subject)}</p><p>Contacto: ${escapeHtml(data.email)}</p><p>Referencia: ${escapeHtml(data.reference)}</p><p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>`,
          ctaLabel: "Abrir Crealy",
          ctaUrl: siteUrl,
        }),
      };
  }
}
