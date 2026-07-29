import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { GenerationGrid } from "@/components/generation/generation-grid";
import { Container } from "@/components/layout/container";
import type { GenerationListItem } from "@/types/generation";

export function DashboardHome({
  firstName,
  recentGenerations,
}: {
  firstName?: string;
  recentGenerations: GenerationListItem[];
}) {
  return (
    <main className="py-10 sm:py-14">
      <Container>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-brand">Tu espacio creativo</p>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
            {firstName ? `Hola, ${firstName}.` : "Hola."}
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted">
            Convierte una idea en una pieza visual lista para compartir.
          </p>
        </div>

        <section className="relative mt-10 overflow-hidden rounded-2xl border border-white/10 bg-surface p-6 sm:p-9">
          <div
            aria-hidden="true"
            className="absolute -right-12 top-1/2 size-72 -translate-y-1/2 rounded-full bg-brand/[0.06] blur-3xl"
          />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/[0.06] px-3 py-1 text-xs font-semibold text-brand">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Generación con IA
            </span>
            <h2 className="mt-8 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
              Empieza con una idea. Termina con una imagen.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
              Elige el formato, describe lo que quieres comunicar y ajusta el
              estilo. Crealy construye el primer resultado contigo.
            </p>
            <Link
              href="/create"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink shadow-[0_14px_38px_rgba(221,245,39,0.12)] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[var(--brand-hover)]"
            >
              Crear nuevo diseño
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </section>

        <section aria-labelledby="recent-projects-title" className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2
                id="recent-projects-title"
                className="text-xl font-semibold text-foreground"
              >
                Creaciones recientes
              </h2>
              <p className="mt-1 text-sm text-muted">
                Tus últimas ideas, siempre a mano.
              </p>
            </div>
            {recentGenerations.length ? (
              <Link
                href="/generations"
                className="text-sm font-semibold text-muted hover:text-foreground"
              >
                Ver todas
              </Link>
            ) : null}
          </div>
          <GenerationGrid items={recentGenerations} compact />
        </section>
      </Container>
    </main>
  );
}
