import { ArrowLeft, Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { getContentTypeConfig, getFormatConfig } from "@/config/generation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import type { ContentType, GenerationFormat } from "@/types/generation";

export const metadata: Metadata = {
  title: "Detalle de creación",
};

export default async function GenerationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("/generations");
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("generations")
    .select(
      "id, user_prompt, content_type, requested_format, style, quality, primary_text, storage_path, status, created_at, projects(title)",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) notFound();

  let imageUrl: string | null = null;
  if (data.status === "completed" && data.storage_path) {
    const { data: signed } = await supabase.storage
      .from("generations")
      .createSignedUrl(data.storage_path, 60 * 60);
    imageUrl = signed?.signedUrl ?? null;
  }

  const project = data.projects as unknown as { title: string } | null;
  const contentType = getContentTypeConfig(data.content_type as ContentType);
  const format = getFormatConfig(data.requested_format as GenerationFormat);

  return (
    <main className="py-8 sm:py-12">
      <Container>
        <Link
          href="/generations"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted hover:text-foreground"
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
                <p className="px-6 text-center text-sm text-muted">
                  Esta imagen no está disponible para previsualizar.
                </p>
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
              <div className="grid grid-cols-2 gap-4 py-3">
                <div>
                  <dt className="text-muted">Estilo</dt>
                  <dd className="mt-1 capitalize text-foreground">{data.style}</dd>
                </div>
                <div>
                  <dt className="text-muted">Calidad</dt>
                  <dd className="mt-1 capitalize text-foreground">{data.quality}</dd>
                </div>
              </div>
            </dl>
            {imageUrl ? (
              <a
                href={`/api/generations/${data.id}/download`}
                className="mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink hover:bg-[var(--brand-hover)]"
              >
                <Download aria-hidden="true" className="size-4" />
                Descargar PNG
              </a>
            ) : null}
          </aside>
        </div>
      </Container>
    </main>
  );
}
