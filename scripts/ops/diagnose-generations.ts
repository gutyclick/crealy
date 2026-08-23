import { heading, opsClient } from "./client";

async function main() {
  heading("Diagnóstico de generaciones recientes");
  const db = opsClient();
  const { data: jobs, error } = await db
    .from("jobs")
    .select(
      "id, resource_id, status, attempt_count, max_attempts, error_code, created_at, updated_at",
    )
    .eq("job_type", "generation")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;

  const jobIds = (jobs ?? []).map((job) => job.id);
  const generationIds = (jobs ?? [])
    .map((job) => job.resource_id)
    .filter((id): id is string => Boolean(id));
  const [
    { data: spans, error: spansError },
    { data: generations, error: generationsError },
    { data: providerCalls, error: providerCallsError },
    { data: references, error: referencesError },
  ] =
    await Promise.all([
      db
        .from("job_stage_spans")
        .select("job_id, attempt_no, stage, status, duration_ms, metadata")
        .in("job_id", jobIds)
        .order("started_at", { ascending: false }),
      db
        .from("generations")
        .select("id, content_type, platform, requested_format, variant, style, status, error_code, user_prompt, enhanced_prompt, brand_style_id, generation_metadata")
        .in("id", generationIds),
      db
        .from("provider_cost_events")
        .select("job_id, operation, succeeded, error_code, duration_ms, created_at")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false }),
      db
        .from("generation_references")
        .select("generation_id")
        .in("generation_id", generationIds),
    ]);
  if (spansError || generationsError || providerCallsError || referencesError) {
    throw spansError || generationsError || providerCallsError || referencesError;
  }

  const generationById = new Map(
    (generations ?? []).map((generation) => [generation.id, generation]),
  );
  console.table(
    (jobs ?? []).map((job) => {
      const generation = generationById.get(job.resource_id);
      const failedStage = (spans ?? []).find(
        (span) => span.job_id === job.id && span.status === "failed",
      );
      const failedProviderCall = (providerCalls ?? []).find(
        (call) => call.job_id === job.id && !call.succeeded,
      );
      const metadata =
        generation?.generation_metadata &&
        typeof generation.generation_metadata === "object"
          ? generation.generation_metadata
          : {};
      return {
        job: job.id.slice(0, 8),
        created: job.created_at,
        status: job.status,
        attempt: `${job.attempt_count}/${job.max_attempts}`,
        product: generation?.content_type ?? "unknown",
        format: generation?.requested_format ?? "unknown",
        variant: generation?.variant ?? "unknown",
        prompt_length: generation?.user_prompt?.length ?? 0,
        enhanced_length: generation?.enhanced_prompt?.length ?? 0,
        references: (references ?? []).filter(
          (reference) => reference.generation_id === job.resource_id,
        ).length,
        brand_style: Boolean(generation?.brand_style_id),
        people_mode: "peopleMode" in metadata ? String(metadata.peopleMode) : "",
        people_count: "peopleCount" in metadata ? String(metadata.peopleCount) : "",
        text_mode: "textMode" in metadata ? String(metadata.textMode) : "",
        job_error: job.error_code ?? "",
        generation_error: generation?.error_code ?? "",
        failed_stage: failedStage?.stage ?? "",
        stage_error:
          typeof failedStage?.metadata === "object" &&
          failedStage.metadata !== null &&
          "errorCode" in failedStage.metadata
            ? String(failedStage.metadata.errorCode)
            : "",
        provider_operation: failedProviderCall?.operation ?? "",
        provider_error: failedProviderCall?.error_code ?? "",
      };
    }),
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : JSON.stringify(error, null, 2) || "Error operativo.",
  );
  process.exitCode = 1;
});
