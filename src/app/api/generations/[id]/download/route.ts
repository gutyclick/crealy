import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getPrivateStorage } from "@/lib/storage/provider";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Inicia sesión para descargar esta imagen." },
      { status: 401 },
    );
  }

  const { data: generation } = await supabase
    .from("generations")
    .select("storage_path, mime_type, content_type, completed_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .maybeSingle();

  if (!generation?.storage_path) {
    return NextResponse.json(
      { error: "No encontramos esta generación." },
      { status: 404 },
    );
  }

  const file = await getPrivateStorage().get(generation.storage_path);
  if (!file) {
    return NextResponse.json(
      { error: "No pudimos descargar la imagen." },
      { status: 500 },
    );
  }

  const date = new Date(generation.completed_at ?? Date.now())
    .toISOString()
    .slice(0, 10);
  const typeName = generation.content_type
    .replace("youtube-", "")
    .replace("social-", "")
    .replace(/[^a-z0-9-]/gi, "");
  const filename = `crealy-${typeName || "imagen"}-${date}.png`;

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": generation.mime_type || "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
