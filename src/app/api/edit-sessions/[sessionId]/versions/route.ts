import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { ensureWelcomeCredits } from "@/lib/credits/credit-service";
import { getEditCreditCost } from "@/lib/credits/get-credit-cost";
import { buildEditInstruction } from "@/lib/editing/build-edit-instruction";
import { getEditingServerEnv } from "@/lib/env/server";
import { getOperationsConfig } from "@/lib/operations/config";
import {
  enforceRateLimit,
  RATE_LIMITS,
} from "@/lib/operations/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ApiErrorResponse } from "@/types/editing";
import type { QueuedEditResponse } from "@/types/jobs";

export const runtime = "nodejs";
export const maxDuration = 180;

const MAX_REQUEST_BYTES = 12_000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function apiError(code: string, message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json<ApiErrorResponse>(
    { code, error: message },
    { status, headers },
  );
}

function reservationError(message: string) {
  if (message.includes("insufficient_credits")) {
    return apiError("insufficient_credits", "No tienes créditos suficientes.", 402);
  }
  if (message.includes("edit_active")) {
    return apiError("edit_active", "Ya tienes un cambio en proceso.", 429);
  }
  if (message.includes("edit_limit")) {
    return apiError("edit_limit", "Alcanzaste el límite diario de ediciones.", 429);
  }
  if (message.includes("edit_cooldown")) {
    return apiError("edit_cooldown", "Espera unos segundos antes de editar otra vez.", 429);
  }
  if (message.includes("version_limit")) {
    return apiError(
      "version_limit",
      "Esta sesión alcanzó su límite de versiones. Inicia una nueva edición.",
      429,
    );
  }
  if (message.includes("session_not_found")) {
    return apiError("not_found", "No encontramos esta sesión activa.", 404);
  }
  if (message.includes("budget_exceeded")) {
    return apiError(
      "editing_disabled",
      "La edición alcanzó temporalmente su capacidad operativa.",
      503,
    );
  }
  return apiError("internal_error", "No pudimos preparar la nueva versión.", 500);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return apiError("invalid_request", "Envía la solicitud como JSON.", 415);
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError("unauthorized", "Inicia sesión para editar.", 401);
  if (!user.email_confirmed_at) {
    return apiError("email_unverified", "Confirma tu correo antes de editar.", 403);
  }

  try {
    const rateLimit = await enforceRateLimit({
      request,
      userId: user.id,
      action: "edit.create",
      userPolicy: RATE_LIMITS.editUser,
      ipPolicy: RATE_LIMITS.editIp,
    });
    if (!rateLimit.allowed) {
      return apiError(
        "rate_limited",
        "Hay demasiadas solicitudes. Espera un momento.",
        429,
        { "Retry-After": String(rateLimit.retryAfter) },
      );
    }
  } catch {
    return apiError("operations_unavailable", "No pudimos validar la solicitud.", 503);
  }

  let config: ReturnType<typeof getEditingServerEnv>;
  let operations: ReturnType<typeof getOperationsConfig>;
  try {
    config = getEditingServerEnv();
    operations = getOperationsConfig();
  } catch {
    return apiError("editing_disabled", "La edición no está disponible.", 503);
  }
  if (!config.editingEnabled || !operations.workerEnabled) {
    return apiError("editing_disabled", "La edición está en mantenimiento.", 503);
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return apiError("invalid_request", "La solicitud es demasiado grande.", 413);
  }
  let body: {
    clientRequestId?: unknown;
    baseVersionId?: unknown;
    instruction?: unknown;
    preserveUnmentionedElements?: unknown;
  };
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > MAX_REQUEST_BYTES) {
      return apiError("invalid_request", "La solicitud es demasiado grande.", 413);
    }
    body = JSON.parse(text);
  } catch {
    return apiError("invalid_request", "La solicitud no contiene JSON válido.", 400);
  }

  const instruction =
    typeof body.instruction === "string" ? body.instruction.trim() : "";
  if (
    typeof body.clientRequestId !== "string" ||
    !UUID_PATTERN.test(body.clientRequestId) ||
    (body.baseVersionId != null &&
      (typeof body.baseVersionId !== "string" ||
        !UUID_PATTERN.test(body.baseVersionId))) ||
    instruction.length < 10 ||
    instruction.length > 1000 ||
    typeof body.preserveUnmentionedElements !== "boolean"
  ) {
    return apiError(
      "invalid_request",
      "Describe el cambio en entre 10 y 1000 caracteres.",
      400,
    );
  }

  const { sessionId } = await params;
  if (!UUID_PATTERN.test(sessionId)) {
    return apiError("not_found", "No encontramos esta sesión.", 404);
  }
  try {
    await ensureWelcomeCredits(user.id);
  } catch {
    return apiError("billing_unavailable", "No pudimos consultar tus créditos.", 503);
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_edit_job_internal", {
    p_user_id: user.id,
    p_session_id: sessionId,
    p_client_request_id: body.clientRequestId,
    p_base_version_id: (body.baseVersionId as string | null) ?? null,
    p_instruction: instruction,
    p_enhanced_instruction: buildEditInstruction({
      instruction,
      preserveComposition: body.preserveUnmentionedElements,
      width: 1,
      height: 1,
    }),
    p_preserve_composition: body.preserveUnmentionedElements,
    p_input_hash: createHash("sha256")
      .update(
        JSON.stringify({
          sessionId,
          baseVersionId: body.baseVersionId ?? null,
          instruction,
          preserveUnmentionedElements: body.preserveUnmentionedElements,
        }),
      )
      .digest("hex"),
    p_credit_cost: getEditCreditCost(),
    p_daily_limit: config.dailyLimit,
    p_cooldown_seconds: config.cooldownSeconds,
    p_version_limit: config.sessionVersionLimit,
    p_estimated_cost_usd: operations.editCostUsd,
    p_daily_budget_usd: operations.dailyBudgetUsd,
    p_monthly_budget_usd: operations.monthlyBudgetUsd,
  });
  if (error || !data?.[0]) return reservationError(error?.message ?? "");

  const queued = data[0];
  const { data: jobReady, error: jobReadyError } = await admin.rpc("mark_job_ready_internal", {
    p_job_id: queued.job_id,
    p_user_id: user.id,
    p_max_attempts: operations.maxAttempts,
  });
  if (jobReadyError || !jobReady) return apiError("operations_unavailable", "No pudimos publicar el trabajo en la cola.", 503);
  return NextResponse.json<QueuedEditResponse>(
    {
      jobId: queued.job_id,
      versionId: queued.version_id,
      sessionId,
      status:
        queued.job_status === "processing" ? "processing" : "queued",
    },
    { status: 202, headers: { Location: `/api/jobs/${queued.job_id}` } },
  );
}
