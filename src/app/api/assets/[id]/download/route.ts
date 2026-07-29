import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { signPrivateDownload } from "@/lib/storage/signed-access";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { id } = await params;
  const { data: asset } = await supabase
    .from("assets")
    .select("storage_key, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!asset || asset.status !== "active") {
    return NextResponse.json({ error: "El archivo original ha expirado." }, { status: 410 });
  }
  const url = await signPrivateDownload(asset.storage_key);
  if (!url) return NextResponse.json({ error: "Archivo no disponible." }, { status: 404 });
  return NextResponse.redirect(url);
}

