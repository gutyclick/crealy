import { NextResponse } from "next/server";

import { analyzeReferenceDesign } from "@/lib/recreate/analyze-reference-design";
import { buildFallbackBlueprint } from "@/lib/recreate/default-blueprint";
import { logger } from "@/lib/observability/logger";
import { isRecreateCategory } from "@/lib/recreate/reference";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para analizar una referencia." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "La solicitud no es válida." }, { status: 400 }); }
  if (typeof body.uploadId !== "string" || typeof body.category !== "string" || !isRecreateCategory(body.category)) {
    return NextResponse.json({ error: "Añade una referencia válida." }, { status: 400 });
  }
  try {
    return NextResponse.json({ blueprint: await analyzeReferenceDesign(user.id, body.uploadId, body.category) });
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : "unknown";
    if (errorCode === "invalid_reference" || errorCode === "reference_not_found") {
      return NextResponse.json({ error: "La referencia ya no está disponible. Vuelve a subirla." }, { status: 422 });
    }
    const providerFailure = typeof error === "object" && error !== null && "status" in error;
    if (!providerFailure && errorCode !== "invalid_recreate_analysis") {
      logger.error("recreate.analysis_failed", { userId: user.id, category: body.category, errorCode: errorCode.slice(0, 120) });
      return NextResponse.json({ error: "No pudimos leer la referencia. Inténtalo de nuevo." }, { status: 500 });
    }
    logger.warn("recreate.analysis_fallback", {
      userId: user.id,
      category: body.category,
      errorCode: errorCode.slice(0, 120),
    });
    return NextResponse.json({ blueprint: buildFallbackBlueprint(body.category), fallback: true });
  }
}
