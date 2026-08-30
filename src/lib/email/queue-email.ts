import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { canSendOptionalEmail } from "@/lib/email/email-preferences";
import type { TransactionalEmailType } from "@/lib/email/templates";
import { getPublicSiteUrl } from "@/lib/seo/get-public-site-url";
import { dispatchQueuedJob } from "@/lib/jobs/dispatch-job";
import { createAdminClient } from "@/lib/supabase/admin";

export async function queueTransactionalEmail({
  userId,
  type,
  audience = "user",
  data = {},
  idempotencyKey,
}: {
  userId?: string | null;
  type: TransactionalEmailType;
  audience?: "user" | "support";
  data?: Record<string, string | number | boolean | null>;
  idempotencyKey: string;
}) {
  if (process.env.TRANSACTIONAL_EMAILS_ENABLED !== "true") return null;
  if (audience === "user" && !userId) return null;
  if (userId && !(await canSendOptionalEmail(userId, type))) return null;

  const admin = createAdminClient();
  const deliveryId = randomUUID();
  const jobId = randomUUID();
  const safeData = { ...data, siteUrl: getPublicSiteUrl() };
  const payload = {
    deliveryId,
    audience,
    type,
    data: safeData,
  };
  const { data: queuedDeliveryId, error } = await admin.rpc(
    "enqueue_transactional_email_internal",
    {
      p_delivery_id: deliveryId,
      p_job_id: jobId,
      p_user_id: userId || null,
      p_email_type: type,
      p_audience: audience,
      p_idempotency_key: idempotencyKey,
      p_data: safeData,
      p_input_hash: createHash("sha256")
        .update(JSON.stringify(payload))
        .digest("hex"),
    },
  );
  if (error || !queuedDeliveryId) {
    return null;
  }
  await dispatchQueuedJob(jobId);
  return queuedDeliveryId;
}
