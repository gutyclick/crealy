import { ArrowLeft, Download, WandSparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { JobProgress } from "@/components/jobs/job-progress";
import { getContentTypeConfig, getFormatConfig } from "@/config/generation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import type { ContentType, GenerationFormat } from "@/types/generation";
import { editGeneration } from "@/app/(dashboard)/edit/actions";
import { getPrivateStorage } from "@/lib/storage/provider";
import { ThumbnailFollowupActions } from "@/components/generation/thumbnail-followup-actions";
import type { ThumbnailPreset, ThumbnailTextMode } from "@/types/generation";

export const metadata: Metadata = {
  title: "Detalle de creación",
};

export default async function GenerationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ job?: string }>;
}) {
  const user = await requireUser("/generations");
  const { id } = await params;
  let { job: jobId } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("generations")
    .select(
      "id, project_id, user_prompt, content_type, requested_format, style, quality, primary_text, storage_path, status, created_at, generation_metadata, projects(title)",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) notFound();

  if (!jobId && data.status !== "completed" && data.status !== "failed") {
    const { data: activeJob } = await supabase
      .from("jobs")
      .select("id")
      .eq("resource_id", data.id)
      .eq("user_id", user.id)
      .in("status", ["queued", "claimed", "processing", "retry_scheduled"])
      .maybeSingle();
    jobId = activeJob?.id;
  }

  let imageUrl: string | null = null;
  if (data.status === "completed" && data.storage_path) {
    imageUrl = await getPrivateStorage().signDownload(
      data.storage_path,
      60 * 60,
    );
  }

  const project = data.projects as unknown as { title: string } | null;
  const contentType = getContentTypeConfig(data.content_type as ContentType);
  const format = getFormatConfig(data.requested_format as GenerationFormat);
  const generationMetadata =
    data.generation_metadata && typeof data.generation_metadata === "object"
      ? data.generation_metadata as Record<string, unknown>
      : {};
  const { data: referenceRows } = data.content_type === "thumbnail"
    ? await supabase
        .from("generation_references")
        .select("upload_id")
        .eq("generation_id", data.id)
        .eq("user_id", user.id)
        .order("position")
    : { data: [] };

  return (
    <main className="py-8 sm:py-12">
      <Container>
        <Link
          href="/generations"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Volver a creaciones
        </Link>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-surface p-3 sm:p-5">
            <div className="grid min-h-72 place-items-center overflow-hidden rounded-xl bg-background">
              {imageUrl ? (
                // Signed Supabase URLs vary by project.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={project?.title ?? "Imagen generada en Crealy"}
                  className="max-h-[72vh] w-full object-contain"
                />
              ) : (
                <div className="w-full max-w-xl px-6">
                  {jobId && data.status !== "failed" ? (
                    <JobProgress jobId={jobId} />
                  ) : (
                    <p className="text-center text-sm text-muted">
                      {data.status === "failed"
                        ? "No pudimos completar esta imagen. Los créditos reservados fueron liberados."
                        : "Esta imagen no está disponible para previsualizar."}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-2xl border border-white/10 bg-surface p-6">
            <p className="text-xs font-semibold text-brand">
              {contentType.fullLabel} · {format.shortLabel}
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
              {project?.title ?? "Creación"}
            </h1>
            <dl className="mt-7 divide-y divide-white/[0.08] text-sm">
              <div className="py-3">
                <dt className="text-muted">Brief</dt>
                <dd className="mt-1 leading-6 text-foreground">{data.user_prompt}</dd>
              </div>
              {data.primary_text ? (
                <div className="py-3">
                  <dt className="text-muted">Texto principal</dt>
                  <dd className="mt-1 text-foreground">{data.primary_text}</dd>
                </div>
              ) : null}
              <div className={data.content_type === "thumbnail" ? "py-3" : "grid grid-cols-2 gap-4 py-3"}>
                <div>
                  <dt className="text-muted">Estilo</dt>
                  <dd className="mt-1 capitalize text-foreground">{data.style}</dd>
                </div>
                {data.content_type !== "thumbnail" ? (
                  <div>
                    <dt className="text-muted">Calidad</dt>
                    <dd className="mt-1 capitalize text-foreground">{data.quality}</dd>
                  </div>
                ) : null}
              </div>
            </dl>
            {imageUrl ? (
              <div className="mt-7 grid gap-2">
                <form action={editGeneration}>
                  <input type="hidden" name="generationId" value={data.id} />
                  <button
                    type="submit"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink hover:bg-[var(--brand-hover)]"
                  >
                    <WandSparkles aria-hidden="true" className="size-4" />
                    {data.content_type === "thumbnail" ? "Regenerar con cambios" : "Editar imagen"}
                  </button>
                </form>
                <a
                  href={`/api/generations/${data.id}/download`}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-semibold text-foreground hover:bg-white/[0.05]"
                >
                  <Download aria-hidden="true" className="size-4" />
                  Descargar PNG
                </a>
                {data.content_type === "thumbnail" ? (
                  <>
                    <ThumbnailFollowupActions
                      generationId={data.id}
                      projectId={data.project_id}
                      topic={data.user_prompt}
                      videoTitle={typeof generationMetadata.videoTitle === "string" ? generationMetadata.videoTitle : undefined}
                      preset={(generationMetadata.thumbnailPreset as ThumbnailPreset) || "impactful"}
                      textMode={(generationMetadata.thumbnailTextMode as ThumbnailTextMode) || "automatic"}
                      primaryText={data.primary_text ?? undefined}
                      referenceUploadIds={(referenceRows ?? []).map((item) => item.upload_id)}
                    />
                    <p className="pt-2 text-center text-xs leading-5 text-muted">
                      Guardada automáticamente en tu historial.
                    </p>
                  </>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </Container>
    </main>
  );
}
