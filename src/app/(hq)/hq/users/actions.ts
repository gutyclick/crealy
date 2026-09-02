"use server";

import { revalidatePath } from "next/cache";

import { queueTransactionalEmail } from "@/lib/email/queue-email";
import { requireHqAdmin } from "@/lib/hq/access";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreditGrantState = {
  status: "idle" | "success" | "error";
  message: string;
  grant?: {
    userId: string;
    email: string;
    amount: number;
    reason: string;
    requestId: string;
  };
};

export type CreditEmailState = {
  status: "success" | "error";
  message: string;
};

export async function grantUserCredits(
  _previousState: CreditGrantState,
  formData: FormData,
): Promise<CreditGrantState> {
  const administrator = await requireHqAdmin();
  const userId = String(formData.get("userId") || "").trim();
  const requestId = String(formData.get("requestId") || "").trim();
  const reason = String(formData.get("reason") || "").trim().replace(/\s+/g, " ");
  const amount = Number(formData.get("amount"));

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    return { status: "error", message: "La solicitud no es válida. Recarga la página e inténtalo otra vez." };
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    return { status: "error", message: "Selecciona una cuenta válida." };
  }
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1_000) {
    return { status: "error", message: "La cantidad debe ser un número entero entre 1 y 1,000." };
  }
  if (reason.length < 5 || reason.length > 100) {
    return { status: "error", message: "Escribe un motivo de entre 5 y 100 caracteres." };
  }

  const admin = createAdminClient();
  const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId);
  if (targetError || !target.user) {
    return { status: "error", message: "La cuenta ya no existe o no está disponible." };
  }

  const administratorLabel = administrator.email?.trim().toLowerCase() || administrator.id;
  const { error } = await admin.rpc("grant_credits_internal", {
    p_user_id: userId,
    p_source_type: "manual_adjustment",
    p_source_reference: `hq:${administrator.id}:${requestId}`,
    p_amount: amount,
    p_expires_at: null,
    p_description: `HQ · ${reason} · ${administratorLabel}`,
  });

  if (error) {
    console.error("[Crealy HQ] credit grant failed", {
      code: error.code,
      administratorId: administrator.id,
      targetUserId: userId,
      requestId,
    });
    return { status: "error", message: "No pudimos acreditar los créditos. El saldo no fue modificado." };
  }

  revalidatePath("/hq/users");
  revalidatePath("/dashboard");
  return {
    status: "success",
    message: `${amount.toLocaleString("es-PA")} ${amount === 1 ? "crédito acreditado" : "créditos acreditados"} a ${target.user.email || "la cuenta"}.`,
    grant: {
      userId,
      email: target.user.email || "Sin correo disponible",
      amount,
      reason,
      requestId,
    },
  };
}

export async function sendCreditGrantEmail({
  userId,
  requestId,
}: {
  userId: string;
  requestId: string;
}): Promise<CreditEmailState> {
  const administrator = await requireHqAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !/^[0-9a-f-]{36}$/i.test(requestId)) {
    return { status: "error", message: "No pudimos validar esta entrega de créditos." };
  }

  const admin = createAdminClient();
  const idempotencyKey = `grant:manual_adjustment:hq:${administrator.id}:${requestId}`;
  const { data: transaction, error } = await admin
    .from("credit_transactions")
    .select("amount,description")
    .eq("user_id", userId)
    .eq("transaction_type", "grant")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (error || !transaction || transaction.amount < 1) {
    return { status: "error", message: "No encontramos el movimiento acreditado. No se envió ningún correo." };
  }

  const parts = transaction.description.split(" · ");
  const reason = parts.length >= 3 ? parts.slice(1, -1).join(" · ") : "Créditos añadidos por el equipo de Crealy";
  const deliveryId = await queueTransactionalEmail({
    userId,
    type: "credit_gift",
    idempotencyKey: `hq-credit-grant:${requestId}`,
    data: { credits: transaction.amount, reason },
  });

  if (!deliveryId) {
    return { status: "error", message: "Los créditos están acreditados, pero el correo no pudo ponerse en cola." };
  }
  return { status: "success", message: "Correo puesto en cola para envío." };
}
