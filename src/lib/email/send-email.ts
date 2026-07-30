import "server-only";

import { getResendClient } from "@/lib/email/client";
import { EmailError } from "@/lib/email/email-errors";
import {
  renderEmailTemplate,
  type TransactionalEmailType,
} from "@/lib/email/templates";

export async function sendTransactionalEmail({
  to,
  type,
  data,
  idempotencyKey,
}: {
  to: string;
  type: TransactionalEmailType;
  data: Record<string, string | number | boolean | null | undefined>;
  idempotencyKey: string;
}) {
  if (process.env.TRANSACTIONAL_EMAILS_ENABLED !== "true") {
    throw new EmailError("transactional_email_disabled");
  }
  const fromAddress = process.env.EMAIL_FROM_ADDRESS?.trim();
  if (!fromAddress) throw new EmailError("email_sender_missing");
  const fromName = process.env.EMAIL_FROM_NAME?.trim() || "Crealy";
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();
  const template = renderEmailTemplate(type, data);
  const { data: result, error } = await getResendClient().emails.send(
    {
      from: `${fromName} <${fromAddress}>`,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: replyTo || undefined,
      tags: [{ name: "email_type", value: type }],
    },
    { idempotencyKey },
  );
  if (error || !result?.id) {
    const statusCode = error?.statusCode ?? null;
    const code =
      statusCode === 429
        ? "provider_rate_limit"
        : statusCode && statusCode >= 500
          ? "provider_unavailable"
          : error?.name || "resend_send_failed";
    throw new EmailError(code, statusCode);
  }
  return result.id;
}
