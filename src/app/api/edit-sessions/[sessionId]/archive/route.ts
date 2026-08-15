import { NextResponse } from "next/server";

import { PRODUCT_FEATURES } from "@/config/product-features";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  if (!PRODUCT_FEATURES.conversationalEditing) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { sessionId } = await params;
  if (!UUID_PATTERN.test(sessionId)) {
    return NextResponse.json({ error: "Sesión no válida." }, { status: 404 });
  }
  const body = (await request.json().catch(() => null)) as
    | { archived?: unknown }
    | null;
  if (!body || typeof body.archived !== "boolean") {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
  }

  const { error } = await supabase.rpc("archive_edit_session", {
    p_session_id: sessionId,
    p_archived: body.archived,
  });
  if (error) {
    return NextResponse.json(
      { error: "No pudimos actualizar la sesión." },
      { status: error.message.includes("not_found") ? 404 : 409 },
    );
  }
  return NextResponse.json({ status: body.archived ? "archived" : "active" });
}
