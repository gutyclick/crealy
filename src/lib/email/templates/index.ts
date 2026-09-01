export type TransactionalEmailType =
  | "welcome"
  | "generation_ready"
  | "edit_ready"
  | "asset_expiring"
  | "low_credits"
  | "subscription_active"
  | "payment_failed"
  | "credit_gift"
  | "support_received"
  | "support_internal"
  | "generation_feedback_internal";

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
  let brandOrigin = "https://www.crealy.app";
  try {
    brandOrigin = new URL(ctaUrl || brandOrigin).origin;
  } catch {
    // Keep the production origin if a caller supplies an invalid URL.
  }
  const logoUrl = `${brandOrigin}/brand/logo_Crealy_w.png`;
  const action =
    ctaLabel && ctaUrl
      ? `<table role="presentation" border="0" cellpadding="0" cellspacing="0" class="cta-table" style="margin:30px 0 0"><tr><td align="center" bgcolor="#DDF527" style="border-radius:12px"><a class="cta-link" href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:15px 24px;color:#111400;font-size:16px;font-weight:700;line-height:20px;text-decoration:none">${escapeHtml(ctaLabel)} &nbsp;&rarr;</a></td></tr></table>`
      : "";
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${escapeHtml(title)}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; border:0; display:block; height:auto; line-height:100%; outline:none; text-decoration:none; }
    @media only screen and (max-width:620px) {
      .email-shell { padding:16px 10px 28px !important; }
      .email-card { border-radius:16px !important; }
      .email-header { padding:24px 22px 20px !important; }
      .email-content { padding:34px 22px 30px !important; }
      .email-title { font-size:30px !important; line-height:34px !important; }
      .email-copy { font-size:16px !important; line-height:25px !important; }
      .cta-table, .cta-table tbody, .cta-table tr, .cta-table td { width:100% !important; }
      .cta-link { box-sizing:border-box !important; display:block !important; text-align:center !important; width:100% !important; }
      .email-footer { padding:22px 12px 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#080808;color:#F7F7F5;font-family:Arial,Helvetica,sans-serif">
  <div style="display:none;font-size:1px;color:#080808;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;background-color:#080808">
    <tr><td align="center" class="email-shell" style="padding:42px 18px 34px">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="email-card" style="width:100%;max-width:600px;background-color:#11120E;border:1px solid #292A25;border-radius:18px;overflow:hidden">
        <tr><td class="email-header" style="padding:28px 42px 24px;border-bottom:1px solid #292A25">
          <a href="${escapeHtml(brandOrigin)}" aria-label="Crealy" style="display:inline-block;text-decoration:none"><img src="${escapeHtml(logoUrl)}" width="132" alt="Crealy" style="width:132px;max-width:132px;height:auto"></a>
        </td></tr>
        <tr><td class="email-content" style="padding:46px 42px 40px">
          <div style="width:44px;height:4px;background-color:#DDF527;border-radius:4px;margin:0 0 26px"></div>
          <h1 class="email-title" style="margin:0 0 20px;color:#F7F7F5;font-size:38px;font-weight:700;letter-spacing:-1.1px;line-height:42px">${escapeHtml(title)}</h1>
          <div class="email-copy" style="color:#BFC0B9;font-size:17px;line-height:28px">${body}</div>
          ${action}
        </td></tr>
      </table>
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px"><tr><td align="center" class="email-footer" style="padding:24px 30px 0;color:#7E8078;font-size:12px;line-height:19px">Este es un correo transaccional relacionado con tu cuenta de Crealy.<br><a href="${escapeHtml(brandOrigin)}/privacy" style="color:#A9AAA3;text-decoration:underline">Política de privacidad</a></td></tr></table>
    </td></tr>
  </table>
</body>
</html>`;
  const text = `${title}\n\n${body.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ")}${ctaLabel && ctaUrl ? `\n\n${ctaLabel}: ${ctaUrl}` : ""}\n\nCrealy · Correo transaccional relacionado con tu cuenta.`;
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
    case "credit_gift":
      return {
        subject: `Tienes ${escapeHtml(data.credits || 5)} créditos de regalo en Crealy`,
        preheader: "Gracias por ser una de las primeras personas en formar parte de Crealy.",
        ...layout({
          preheader: "Gracias por ser una de las primeras personas en formar parte de Crealy.",
          title: `Te regalamos ${escapeHtml(data.credits || 5)} créditos para seguir creando.`,
          body: `<p style="margin:0 0 18px">Gracias por ser una de las primeras personas en formar parte de Crealy.</p><p style="margin:0 0 22px">Queremos que sigas poniendo a prueba tus ideas, así que añadimos este regalo a tu cuenta:</p><table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 22px;background-color:#191A15;border:1px solid #34372A;border-radius:14px"><tr><td style="padding:22px 24px"><strong style="display:block;color:#DDF527;font-size:28px;line-height:32px">+${escapeHtml(data.credits || 5)} créditos</strong><span style="display:block;margin-top:5px;color:#F7F7F5;font-size:14px;line-height:20px">Ya están disponibles en tu saldo.</span></td></tr></table><p style="margin:0">Úsalos para crear una miniatura, un post o probar Recreate. Son tuyos y puedes utilizarlos cuando quieras.</p>`,
          ctaLabel: "Seguir creando",
          ctaUrl: `${siteUrl}/create`,
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
    case "generation_feedback_internal":
      return {
        subject: `Opinión sobre una generación: ${String(data.verdict || "nueva")}`,
        preheader: "Un usuario dejó detalles sobre un resultado de Crealy.",
        ...layout({
          preheader: "Un usuario dejó detalles sobre un resultado de Crealy.",
          title: "Nueva opinión sobre una generación.",
          body: `<p>Resultado: <strong style="color:#F7F7F5">${escapeHtml(data.generationId)}</strong></p><p>Formato: ${escapeHtml(data.format || "No indicado")}</p><p>Valoración: ${escapeHtml(data.verdict)}</p><p>Motivos: ${escapeHtml(data.reasons || "Sin motivos adicionales")}</p><p>Usuario: ${escapeHtml(data.email || "No disponible")}</p><p style="white-space:pre-wrap">${escapeHtml(data.comment || "Sin comentario adicional")}</p>`,
        }),
      };
  }
}
