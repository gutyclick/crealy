import { ArrowUpRight, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

import { getContentTypeConfig, getFormatConfig } from "@/config/generation";
import type { GenerationListItem } from "@/types/generation";

const dateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function GenerationGrid({
  items,
  compact = false,
}: {
  items: GenerationListItem[];
  compact?: boolean;
}) {
  if (!items.length) {
    return (
      <div className="rounded-2xl bg-surface px-6 py-12 text-center sm:px-8 sm:py-16">
        <div className="mx-auto grid size-11 place-items-center rounded-[0.8rem] bg-white/[0.055]">
          <ImageIcon aria-hidden="true" className="size-5 text-white/55" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-foreground">
          Todavía no tienes creaciones.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">
          Describe tu primera idea y Crealy la convertirá en una pieza visual.
        </p>
        <Link
          href="/create"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink transition-colors hover:bg-[var(--brand-hover)]"
        >
          Crear mi primera imagen
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      }
    >
      {items.map((item) => {
        const contentType = getContentTypeConfig(item.contentType);
        const format = getFormatConfig(item.format);

        return (
          <Link
            key={item.id}
            href={`/generations/${item.id}`}
            className="group overflow-hidden rounded-2xl bg-surface shadow-[0_18px_50px_rgba(0,0,0,.16)] transition-transform duration-300 ease-out hover:-translate-y-1"
          >
            <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-surface-elevated">
              {item.imageUrl ? (
                // Signed Supabase URLs vary by project.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.projectTitle}
                  className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
                />
              ) : (
                <ImageIcon aria-hidden="true" className="size-6 text-white/30" />
              )}
              {item.status !== "completed" ? (
                <span className="absolute left-3 top-3 rounded-full border border-white/12 bg-background/90 px-2.5 py-1 text-xs font-semibold text-muted">
                  {item.status === "failed"
                    ? "No completada"
                    : item.status === "processing"
                      ? "Generando"
                      : "Pendiente"}
                </span>
              ) : null}
            </div>
            <div className="p-4">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {item.projectTitle}
              </h3>
              <p className="mt-2 flex items-center justify-between gap-3 text-xs text-muted">
                <span>
                  {contentType.label} · {format.shortLabel}
                </span>
                <time dateTime={item.createdAt}>
                  {dateFormatter.format(new Date(item.createdAt))}
                </time>
              </p>
              <p className="mt-2 flex items-center gap-2 text-[11px] text-white/45">
                <span>{item.quality === "high" ? "Alta calidad" : "Estándar"}</span>
                {item.creditCost ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {item.creditCost} {item.creditCost === 1 ? "crédito" : "créditos"}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
