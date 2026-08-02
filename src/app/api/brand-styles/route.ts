import { NextResponse } from "next/server";

import { getBrandStyleAccess, listBrandStyles, mapBrandStyle, sanitizeStyleName } from "@/lib/brand-styles/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function auth() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); return user; }

export async function GET() {
  const user = await auth(); if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const access = await getBrandStyleAccess(user.id);
  const styles = access.entitlement.enabled ? await listBrandStyles(user.id) : [];
  return NextResponse.json({ styles, plan: access.plan, entitlement: access.entitlement });
}

export async function POST(request: Request) {
  const user = await auth(); if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const name = sanitizeStyleName((await request.json().catch(() => null) as { name?: unknown } | null)?.name);
  if (!name) return NextResponse.json({ error: "Escribe un nombre de hasta 80 caracteres." }, { status: 400 });
  const { entitlement } = await getBrandStyleAccess(user.id);
  if (!entitlement.enabled) return NextResponse.json({ error: "Crea una identidad visual reconocible", code: "upgrade_required" }, { status: 403 });
  const admin = createAdminClient();
  const { count } = await admin.from("brand_styles").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if ((count ?? 0) >= entitlement.maxStyles) return NextResponse.json({ error: "Has alcanzado el límite de estilos", code: "style_limit" }, { status: 409 });
  const { data, error } = await admin.from("brand_styles").insert({ user_id: user.id, name, supported_design_types: entitlement.supportedDesignTypes }).select().single();
  if (error) return NextResponse.json({ error: "No pudimos crear el estilo." }, { status: 500 });
  return NextResponse.json({ style: await mapBrandStyle(data) }, { status: 201 });
}
