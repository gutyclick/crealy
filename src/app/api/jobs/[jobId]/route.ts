import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { JobRecord, PublicJob } from "@/types/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toPublicJob(job: JobRecord): PublicJob {
  return {
    id: job.id,
    type: job.job_type,
    status: job.status,
    resourceId: job.resource_id,
    attemptCount: job.attempt_count,
    maxAttempts: job.max_attempts,
    errorCode: job.error_code,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  if (!UUID_PATTERN.test(jobId)) {
    return NextResponse.json({ error: "Job no encontrado." }, { status: 404 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  }
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .maybeSingle();
  const job = data as JobRecord | null;
  if (error || !job) {
    return NextResponse.json({ error: "Job no encontrado." }, { status: 404 });
  }

  return NextResponse.json(toPublicJob(job), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  if (!UUID_PATTERN.test(jobId)) {
    return NextResponse.json({ error: "Job no encontrado." }, { status: 404 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("cancel_job_internal", {
    p_job_id: jobId,
    p_user_id: user.id,
  });
  if (error) {
    return NextResponse.json(
      { error: "No pudimos cancelar el trabajo." },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: "El trabajo ya comenzó o terminó." },
      { status: 409 },
    );
  }
  return NextResponse.json({ status: "cancelled" });
}
