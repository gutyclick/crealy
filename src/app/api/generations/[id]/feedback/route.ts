import { NextResponse } from "next/server";

import {
  parseGenerationFeedbackInput,
  pickAutomaticEvaluation,
} from "@/lib/generation/generation-feedback";
import { readLimitedBody } from "@/lib/http/read-limited-body";
import { enforceRateLimit } from "@/lib/operations/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { recordGenerationEvent } from "@/lib/analytics/generation-telemetry";

export const runtime = "nodejs";

const feedbackRateLimit = { limit: 20, windowSeconds: 3600 };

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para opinar." }, { status: 401 });
  }

  const limited = await enforceRateLimit({
    request,
    userId: user.id,
    action: "generation.feedback",
    userPolicy: feedbackRateLimit,
    ipPolicy: feedbackRateLimit,
  }).catch(() => null);
  if (!limited) {
    return NextResponse.json({ error: "No pudimos guardar tu opinión." }, { status: 503 });
  }
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Has enviado varias opiniones. Espera un momento." },
      { status: 429 },
    );
  }

  const boundedBody = await readLimitedBody(request, 8_000);
  if (!boundedBody) {
    return NextResponse.json({ error: "La solicitud es demasiado grande." }, { status: 413 });
  }
  const raw = await new Request(request.url, {
    method: "PUT",
    headers: request.headers,
    body: boundedBody,
  }).json().catch(() => null);
  const input = parseGenerationFeedbackInput(raw);
  if (!input) {
    return NextResponse.json(
      { error: "Revisa los motivos y el detalle de la corrección." },
      { status: 400 },
    );
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data: generation, error: generationError } = await admin
    .from("generations")
    .select(
      "id, user_id, status, content_type, platform, cover_platform, requested_format, variant, style, quality, color_preference, custom_colors, primary_text, profile_mode, style_consistency, user_prompt, credit_cost, requested_width, requested_height, export_width, export_height, provider, model, created_at, completed_at, generation_metadata",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (generationError || !generation || generation.status !== "completed") {
    return NextResponse.json(
      { error: "No encontramos un resultado terminado para evaluar." },
      { status: 404 },
    );
  }

  const metadata =
    generation.generation_metadata &&
    typeof generation.generation_metadata === "object" &&
    !Array.isArray(generation.generation_metadata)
      ? generation.generation_metadata as Record<string, unknown>
      : {};
  const configurationSnapshot = JSON.parse(JSON.stringify({
    contentType: generation.content_type,
    platform: generation.platform,
    coverPlatform: generation.cover_platform,
    requestedFormat: generation.requested_format,
    variant: generation.variant,
    style: generation.style,
    quality: generation.quality,
    colorPreference: generation.color_preference,
    customColors: generation.custom_colors,
    primaryText: generation.primary_text,
    profileMode: generation.profile_mode,
    styleConsistency: generation.style_consistency,
    creationMode: metadata.creationMode ?? "create",
    generationIntent: metadata.generationIntent ?? "initial",
    thumbnailPreset: metadata.thumbnailPreset ?? null,
    thumbnailTextMode: metadata.thumbnailTextMode ?? null,
    textMode: metadata.textMode ?? metadata.thumbnailTextMode ?? null,
    recreateSimilarity: metadata.recreateSimilarity ?? null,
    recreateFocus: metadata.recreateFocus ?? null,
    recreateGoal: metadata.recreateGoal ?? null,
    recreatePreservation: metadata.recreatePreservation ?? null,
    creditCost: generation.credit_cost,
    requestedWidth: generation.requested_width,
    requestedHeight: generation.requested_height,
    exportWidth: generation.export_width,
    exportHeight: generation.export_height,
    provider: generation.provider,
    model: generation.model,
    prompt: generation.user_prompt,
    createdAt: generation.created_at,
    completedAt: generation.completed_at,
  })) as Json;
  const automaticEvaluationSnapshot = JSON.parse(
    JSON.stringify(pickAutomaticEvaluation(metadata)),
  ) as Json;

  const { data: saved, error: saveError } = await admin
    .from("generation_feedback")
    .upsert(
      {
        generation_id: generation.id,
        user_id: user.id,
        verdict: input.verdict,
        reasons: input.reasons,
        comment: input.comment,
        correction_requested: input.correctionRequested,
        correction_request: input.correctionRequest,
        configuration_snapshot: configurationSnapshot,
        automatic_evaluation_snapshot: automaticEvaluationSnapshot,
      },
      { onConflict: "user_id,generation_id" },
    )
    .select("verdict, reasons, comment, correction_requested, correction_request, updated_at")
    .single();

  if (saveError || !saved) {
    return NextResponse.json({ error: "No pudimos guardar tu opinión." }, { status: 503 });
  }

  const { data: generationJob } = await admin
    .from("jobs")
    .select("id")
    .eq("job_type", "generation")
    .eq("resource_id", generation.id)
    .eq("user_id", user.id)
    .maybeSingle();
  await recordGenerationEvent({
    generationId: generation.id,
    userId: user.id,
    jobId: generationJob?.id ?? null,
    type: input.verdict === "useful" ? "approved" : "rejected",
    idempotencyKey: `feedback:${saved.updated_at}:${input.verdict}`,
    properties: {
      reasons: input.reasons,
      hasComment: Boolean(input.comment),
      correctionRequested: input.correctionRequested,
    },
  }).catch(() => null);
  if (input.correctionRequested) {
    await recordGenerationEvent({
      generationId: generation.id,
      userId: user.id,
      jobId: generationJob?.id ?? null,
      type: "correction_requested",
      idempotencyKey: `feedback:${saved.updated_at}:correction`,
      properties: { reasons: input.reasons },
    }).catch(() => null);
  }

  return NextResponse.json({
    feedback: {
      verdict: saved.verdict,
      reasons: saved.reasons,
      comment: saved.comment,
      correctionRequested: saved.correction_requested,
      correctionRequest: saved.correction_request,
      updatedAt: saved.updated_at,
    },
  });
}
