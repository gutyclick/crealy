import { NextResponse } from "next/server";
import { getPrivateStorage } from "@/lib/storage/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(_: Request, { params }: { params: Promise<{ styleId: string; referenceId: string }> }) {
  const { data: { user } } = await (await createClient()).auth.getUser(); if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const { styleId, referenceId } = await params; const admin = createAdminClient();
  const { data } = await admin.from("brand_style_references").select("storage_path").eq("id", referenceId).eq("style_id", styleId).eq("user_id", user.id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Referencia no encontrada." }, { status: 404 });
  const { error } = await admin.from("brand_style_references").delete().eq("id", referenceId).eq("user_id", user.id); if (error) return NextResponse.json({ error: "No pudimos eliminar la referencia." }, { status: 500 });
  await getPrivateStorage().remove(data.storage_path).catch(() => undefined);
  const { data: remaining } = await admin.from("brand_style_references").select("id, position").eq("style_id", styleId).eq("user_id", user.id).order("position");
  for (const [index, reference] of (remaining ?? []).entries()) {
    if (reference.position !== index + 1) await admin.from("brand_style_references").update({ position: index + 1 }).eq("id", reference.id).eq("user_id", user.id);
  }
  return NextResponse.json({ ok: true });
}
