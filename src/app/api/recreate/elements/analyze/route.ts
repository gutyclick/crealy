import { NextResponse } from "next/server";

import { readLimitedBody } from "@/lib/http/read-limited-body";
import { logger } from "@/lib/observability/logger";
import { enforceRateLimit } from "@/lib/operations/rate-limit";
import { analyzeRecreateElement } from "@/lib/recreate/analyze-element";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Inicia sesión para analizar tus elementos." },
      { status: 401 },
    );
  }

  const rateLimit = await enforceRateLimit({
    request,
    userId: user.id,
    action: "recreate.element.analyze",
    userPolicy: { limit: 60, windowSeconds: 3_600 },
    ipPolicy: { limit: 120, windowSeconds: 3_600 },
  }).catch(() => null);
  if (!rateLimit) {
    return NextResponse.json(
      { error: "No pudimos validar el análisis." },
      { status: 503 },
    );
  }
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Alcanzaste el límite de análisis. Inténtalo más tarde." },
      { status: 429 },
    );
  }

  const boundedBody = await readLimitedBody(request, 2_000);
  if (!boundedBody) {
    return NextResponse.json(
      { error: "La solicitud es demasiado grande." },
      { status: 413 },
    );
  }
  const body = (await new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: boundedBody,
  })
    .json()
    .catch(() => null)) as { uploadId?: unknown } | null;

  if (typeof body?.uploadId !== "string") {
    return NextResponse.json(
      { error: "Sube un elemento válido." },
      { status: 400 },
    );
  }

  try {
    const analysis = await analyzeRecreateElement(user.id, body.uploadId);
    return NextResponse.json({ analysis });
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown";
    logger.warn("recreate.element_analysis_failed", {
      userId: user.id,
      errorCode: code.slice(0, 120),
    });
    return NextResponse.json(
      {
        error:
          code === "invalid_element" || code === "element_not_found"
            ? "Ese elemento ya no está disponible. Vuelve a subirlo."
            : "No pudimos reconocer el elemento. Prueba con una imagen más clara.",
      },
      { status: code === "invalid_element" || code === "element_not_found" ? 422 : 503 },
    );
  }
}
