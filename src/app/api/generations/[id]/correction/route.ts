import { NextResponse } from "next/server";

import { POST as createGeneration } from "@/app/api/generations/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para corregir un diseño." }, { status: 401 });

  const body = await request.json().catch(() => null) as { instruction?: unknown } | null;
  const instruction = typeof body?.instruction === "string" ? body.instruction.trim() : "";
  if (instruction.length < 10 || instruction.length > 1200) {
    return NextResponse.json({ error: "Describe el cambio entre 10 y 1.200 caracteres." }, { status: 400 });
  }

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "No encontramos el diseño." }, { status: 404 });

  const admin = createAdminClient();
  const { data: generation, error } = await admin
    .from("generations")
    .select("id,user_id,project_id,user_prompt,content_type,platform,cover_platform,requested_format,style,quality,color_preference,custom_colors,primary_text,profile_mode,style_consistency,generation_metadata,asset_id,storage_path,mime_type,width,height,status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !generation || generation.status !== "completed" || !generation.storage_path || !generation.mime_type || !generation.width || !generation.height) {
    return NextResponse.json({ error: "No encontramos un resultado terminado para corregir." }, { status: 404 });
  }

  const metadata = generation.generation_metadata && typeof generation.generation_metadata === "object" && !Array.isArray(generation.generation_metadata)
    ? generation.generation_metadata as Record<string, unknown>
    : {};
  const { data: asset } = generation.asset_id
    ? await admin.from("assets").select("file_size_bytes,expires_at").eq("id", generation.asset_id).eq("user_id", user.id).maybeSingle()
    : { data: null };
  const { data: sourceUpload, error: uploadError } = await admin
    .from("user_uploads")
    .insert({
      user_id: user.id,
      asset_id: generation.asset_id,
      storage_path: generation.storage_path,
      original_filename: `correction-source-${generation.id}.${generation.mime_type.split("/")[1] || "png"}`,
      mime_type: generation.mime_type,
      file_size: asset?.file_size_bytes ?? 1,
      width: generation.width,
      height: generation.height,
      purpose: "reference",
      expires_at: asset?.expires_at ?? null,
    })
    .select("id")
    .single();
  if (uploadError || !sourceUpload) {
    return NextResponse.json({ error: "No pudimos preparar la imagen anterior como referencia." }, { status: 503 });
  }

  const creationMode = metadata.creationMode === "recreate" ? "recreate" : "create";
  const correctionHasPerson =
    generation.content_type === "profile-image" ||
    (typeof metadata.peopleCount === "number" && metadata.peopleCount > 0) ||
    metadata.peopleMode === "generated" ||
    metadata.peopleMode === "uploaded";
  const payload: Record<string, unknown> = {
    clientRequestId: crypto.randomUUID(),
    projectId: generation.project_id,
    parentGenerationId: generation.id,
    generationIntent: "variation",
    contentType: generation.content_type,
    platform: generation.platform ?? generation.cover_platform ?? undefined,
    coverPlatform: generation.cover_platform ?? undefined,
    description: `${generation.user_prompt}\n\nCORRECCIÓN SOLICITADA: ${instruction}\nUsa el resultado anterior como referencia principal. Aplica únicamente el cambio solicitado y conserva las decisiones visuales, la composición y la identidad de las personas que el usuario no pidió modificar.`,
    primaryText: generation.primary_text ?? undefined,
    textMode: metadata.textMode ?? metadata.thumbnailTextMode ?? (generation.primary_text ? "custom" : "none"),
    style: generation.style,
    colorPreference: generation.color_preference,
    customColors: generation.custom_colors ?? undefined,
    variant: generation.requested_format,
    format: generation.requested_format,
    quality: generation.quality,
    profileMode: generation.profile_mode ?? undefined,
    profileIntensity: metadata.profileIntensity ?? undefined,
    profileBackground: metadata.profileBackground ?? undefined,
    showSafeArea: metadata.showSafeArea ?? false,
    videoTitle: metadata.videoTitle ?? undefined,
    thumbnailPreset: metadata.thumbnailPreset ?? undefined,
    thumbnailTextMode: metadata.thumbnailTextMode ?? undefined,
    brandStyleId: metadata.brandStyleId ?? undefined,
    styleConsistency: generation.style_consistency ?? metadata.styleConsistency ?? undefined,
    creationMode,
    referenceUploadIds: [sourceUpload.id],
    peopleMode: creationMode === "create" && correctionHasPerson ? "uploaded" : "none",
    peopleCount: creationMode === "create" && correctionHasPerson ? 1 : 0,
    includeElements: creationMode === "create" ? !correctionHasPerson : undefined,
    referenceDescriptors: creationMode === "create"
      ? [{ kind: correctionHasPerson ? "person" : "other", identifier: "resultado anterior" }]
      : undefined,
    recreateSimilarity: metadata.recreateSimilarity ?? undefined,
    recreateBlueprint: metadata.recreateBlueprint ?? undefined,
    recreateFocus: metadata.recreateFocus ?? undefined,
    recreateGoal: metadata.recreateGoal ?? undefined,
    recreateReferenceRoles: creationMode === "recreate" ? [] : undefined,
    recreateElementAnalyses: creationMode === "recreate" ? [] : undefined,
    recreatePreservation: metadata.recreatePreservation ?? undefined,
  };

  const generationRequest = new Request(new URL("/api/generations", request.url), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: request.headers.get("cookie") ?? "",
      "user-agent": request.headers.get("user-agent") ?? "Crealy correction",
      "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
    },
    body: JSON.stringify(payload),
  });
  const response = await createGeneration(generationRequest);
  if (!response.ok) {
    await admin.from("user_uploads").delete().eq("id", sourceUpload.id).eq("user_id", user.id);
  }
  return response;
}
