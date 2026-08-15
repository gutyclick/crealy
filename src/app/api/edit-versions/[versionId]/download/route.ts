import { NextResponse } from "next/server";

import { PRODUCT_FEATURES } from "@/config/product-features";
import { resolveVersionSource } from "@/lib/editing/resolve-version-source";
import { createClient } from "@/lib/supabase/server";
import { getPrivateStorage } from "@/lib/storage/provider";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ versionId: string }> },
) {
  if (!PRODUCT_FEATURES.conversationalEditing) {
    return new NextResponse("No encontrada.", { status: 404 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autorizado.", { status: 401 });

  const { versionId } = await params;
  const { data: version } = await supabase
    .from("edit_versions")
    .select(
      "storage_path, source_generation_id, source_upload_id, mime_type, width, height",
    )
    .eq("id", versionId)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .maybeSingle();
  if (!version) return new NextResponse("No encontrada.", { status: 404 });

  const source = await resolveVersionSource(supabase, version);
  if (!source?.storagePath) {
    return new NextResponse("No encontrada.", { status: 404 });
  }

  const data = await getPrivateStorage().get(source.storagePath);
  if (!data) {
    return new NextResponse("No pudimos descargar la imagen.", { status: 500 });
  }

  const filename = `crealy-version-${versionId.slice(0, 8)}.${source.mimeType === "image/jpeg" ? "jpg" : source.mimeType?.split("/")[1] || "png"}`;
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": source.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
