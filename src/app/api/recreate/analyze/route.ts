import { NextResponse } from "next/server";

import { analyzeReferenceDesign } from "@/lib/recreate/analyze-reference-design";
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
  } catch {
    return NextResponse.json({ error: "No pudimos analizar esta referencia. Prueba con otra imagen." }, { status: 422 });
  }
}

