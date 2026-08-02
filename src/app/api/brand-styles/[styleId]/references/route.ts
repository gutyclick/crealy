import { NextResponse } from "next/server";
import { addBrandStyleReference, mapBrandStyle, requireOwnedStyle } from "@/lib/brand-styles/service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ styleId: string }> }) {
  const { data: { user } } = await (await createClient()).auth.getUser(); if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const id = (await params).styleId; const body = await request.json().catch(() => null) as { uploadIds?: unknown } | null; const uploadIds = Array.isArray(body?.uploadIds) ? body.uploadIds.filter((item): item is string => typeof item === "string") : [];
  if (!uploadIds.length || uploadIds.length > 10) return NextResponse.json({ error: "Selecciona al menos una imagen." }, { status: 400 });
  try { for (const uploadId of uploadIds) await addBrandStyleReference(user.id, id, uploadId); return NextResponse.json({ style: await mapBrandStyle(await requireOwnedStyle(user.id, id)) }); }
  catch (error) { const code = error instanceof Error ? error.message : "upload_failed"; const message = code === "duplicate_style_reference" ? "Esa referencia ya forma parte del estilo." : code === "style_reference_limit" ? "Alcanzaste el máximo de referencias de tu plan." : "No pudimos guardar una de las referencias."; return NextResponse.json({ error: message, code }, { status: 400 }); }
}
