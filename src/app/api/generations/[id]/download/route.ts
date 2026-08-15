import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getPrivateStorage } from "@/lib/storage/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordGenerationEvent } from "@/lib/analytics/generation-telemetry";
import { recordActivationEvent } from "@/lib/analytics/activation";

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
    .select("storage_path, mime_type, content_type, completed_at, generation_metadata")
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

  const metadata = generation.generation_metadata && typeof generation.generation_metadata === "object"
    ? generation.generation_metadata as Record<string, unknown>
    : {};
  await createAdminClient()
    .from("generations")
    .update({ generation_metadata: { ...metadata, downloaded: true, selectedByUser: true } })
    .eq("id", id)
    .eq("user_id", user.id);

  const admin = createAdminClient();
  const { data: job } = await admin
    .from("jobs")
    .select("id")
    .eq("job_type", "generation")
    .eq("resource_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  await recordGenerationEvent({
    generationId: id,
    userId: user.id,
    jobId: job?.id ?? null,
    type: "downloaded",
    idempotencyKey: "result:first-download",
    properties: { source: "generation_detail" },
  }).catch(() => null);
  await recordActivationEvent({
    userId: user.id,
    type: "first_result_downloaded",
    idempotencyKey: "activation:first-result-downloaded",
    properties: { generationId: id, contentType: generation.content_type },
  }).catch(() => null);

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": generation.mime_type || "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
