import { NextResponse } from "next/server";

import { PRODUCT_FEATURES } from "@/config/product-features";
import { createClient } from "@/lib/supabase/server";

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
  const body = (await request.json().catch(() => null)) as
    | { versionId?: unknown }
    | null;
  if (
    !body ||
    typeof body.versionId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(body.versionId)
  ) {
    return NextResponse.json({ error: "Versión no válida." }, { status: 400 });
  }

  const { error } = await supabase.rpc("restore_edit_version", {
    p_session_id: sessionId,
    p_version_id: body.versionId,
  });
  if (error) {
    return NextResponse.json(
      { error: "No pudimos restaurar esta versión." },
      { status: error.message.includes("not_found") ? 404 : 500 },
    );
  }

  return NextResponse.json({ currentVersionId: body.versionId });
}
