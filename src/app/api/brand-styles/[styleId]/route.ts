import { NextResponse } from "next/server";

import { deleteStyleAndStorage, mapBrandStyle, requireOwnedStyle, sanitizeStyleName } from "@/lib/brand-styles/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function userId() { const { data: { user } } = await (await createClient()).auth.getUser(); return user?.id; }

export async function GET(_: Request, { params }: { params: Promise<{ styleId: string }> }) {
  const user = await userId(); if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  try { return NextResponse.json({ style: await mapBrandStyle(await requireOwnedStyle(user, (await params).styleId)) }); }
  catch { return NextResponse.json({ error: "No encontramos este estilo." }, { status: 404 }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ styleId: string }> }) {
  const user = await userId(); if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const id = (await params).styleId; try { await requireOwnedStyle(user, id); } catch { return NextResponse.json({ error: "No encontramos este estilo." }, { status: 404 }); }
  const name = sanitizeStyleName((await request.json().catch(() => null) as { name?: unknown } | null)?.name);
  if (!name) return NextResponse.json({ error: "Escribe un nombre de hasta 80 caracteres." }, { status: 400 });
  const { data, error } = await createAdminClient().from("brand_styles").update({ name, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user).select().single();
  if (error) return NextResponse.json({ error: "No pudimos actualizar el estilo." }, { status: 500 });
  return NextResponse.json({ style: await mapBrandStyle(data) });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ styleId: string }> }) {
  const user = await userId(); if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  try { await deleteStyleAndStorage(user, (await params).styleId); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "No pudimos eliminar el estilo." }, { status: 404 }); }
}
