import { NextResponse } from "next/server";
import { getBrandStyleAccess, requireOwnedStyle } from "@/lib/brand-styles/service";
import { getPrivateStorage } from "@/lib/storage/provider";
import { brandStyleReferencePath } from "@/lib/storage/storage-paths";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: Promise<{ styleId: string }> }) {
  const { data: { user } } = await (await createClient()).auth.getUser(); if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const { entitlement } = await getBrandStyleAccess(user.id); if (!entitlement.canDuplicate) return NextResponse.json({ error: "Duplicar estilos está disponible en Pro." }, { status: 403 });
  const source = await requireOwnedStyle(user.id, (await params).styleId); const admin = createAdminClient(); const { count } = await admin.from("brand_styles").select("id", { count: "exact", head: true }).eq("user_id", user.id); if ((count ?? 0) >= entitlement.maxStyles) return NextResponse.json({ error: "Has alcanzado el límite de estilos." }, { status: 409 });
  const { data: copy, error } = await admin.from("brand_styles").insert({ user_id: user.id, name: `${source.name} — copia`.slice(0, 80), description: source.description, visual_summary: source.visual_summary, visual_attributes: source.visual_attributes, consistency_score: source.consistency_score, warnings: source.warnings, supported_design_types: source.supported_design_types, analysis_status: source.analysis_status }).select().single(); if (error) return NextResponse.json({ error: "No pudimos duplicar el estilo." }, { status: 500 });
  const { data: refs } = await admin.from("brand_style_references").select("*").eq("style_id", source.id).eq("user_id", user.id).order("position");
  for (const ref of refs ?? []) { const body = await getPrivateStorage().get(ref.storage_path); if (!body) continue; const id = crypto.randomUUID(); const path = brandStyleReferencePath({ userId: user.id, styleId: copy.id, referenceId: id }); await getPrivateStorage().put(path, body, ref.mime_type); await admin.from("brand_style_references").insert({ id, style_id: copy.id, user_id: user.id, storage_path: path, original_filename: ref.original_filename, mime_type: ref.mime_type, file_size: ref.file_size, width: ref.width, height: ref.height, content_hash: ref.content_hash, position: ref.position }); }
  return NextResponse.json({ id: copy.id }, { status: 201 });
}
