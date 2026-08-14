import {
  ArrowRight,
  ArrowUpRight,
  CircleUserRound,
  Clock3,
  Check,
  Image,
  MonitorPlay,
  PanelsTopLeft,
  PencilLine,
  RectangleHorizontal,
  Smartphone,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { RecentEditSessions } from "@/components/editing/recent-edit-sessions";
import { GenerationGrid } from "@/components/generation/generation-grid";
import { Container } from "@/components/layout/container";
import type { RecentEditSession } from "@/types/editing";
import type { GenerationListItem } from "@/types/generation";

const quickCreate = [
  { href: "/create?type=thumbnail", label: "Miniatura", detail: "Para videos que necesitan destacar", icon: MonitorPlay },
  { href: "/create?type=social-post", label: "Post", detail: "Para feeds y campañas sociales", icon: Image },
  { href: "/create?type=banner", label: "Banner", detail: "Para campañas y cabeceras web", icon: RectangleHorizontal },
  { href: "/create?type=social-cover", label: "Portada", detail: "Para canales y perfiles", icon: PanelsTopLeft },
  { href: "/create?type=story", label: "Historia", detail: "Para contenido breve y vertical", icon: Smartphone },
  { href: "/create?type=profile-image", label: "Perfil", detail: "Para personas, objetos y marcas", icon: CircleUserRound },
] as const;

const recommended = [
  { type: "thumbnail", label: "Miniatura", detail: "1280 × 720 · 1 crédito", shape: "aspect-video" },
  { type: "social-post", label: "Post vertical", detail: "1080 × 1350 · 1 crédito", shape: "aspect-[4/5]" },
  { type: "story", label: "Historia 9:16", detail: "1080 × 1920 · 2 créditos", shape: "aspect-[9/16]" },
  { type: "profile-image", label: "Imagen de perfil", detail: "800 × 800 · optimizada para redes", shape: "aspect-square rounded-full" },
] as const;

const planLabels: Record<string, string> = {
  free: "Gratis",
  starter: "Starter",
  pro: "Creator",
  business: "Pro",
};

export function DashboardHome({
  firstName,
  recentGenerations,
  creationsAvailable,
  recentEditSessions,
  activeJobs,
  plan,
  credits,
  billingAvailable,
  jobsAvailable,
}: {
  firstName?: string;
  recentGenerations: GenerationListItem[];
  creationsAvailable: boolean;
  recentEditSessions: RecentEditSession[];
  activeJobs: Array<{
    id: string;
    type: string;
    status: string;
    resourceId: string;
    createdAt: string;
  }>;
  plan: string | null;
  credits: number | null;
  billingAvailable: boolean;
  jobsAvailable: boolean;
}) {
  return (
    <main className="pb-20 pt-6 sm:pt-10">
      <Container>
        <section className="dashboard-studio relative isolate min-h-[29rem] overflow-hidden rounded-2xl bg-[#11120e] px-6 py-8 shadow-[0_30px_100px_rgba(0,0,0,.28)] sm:px-10 sm:py-11 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.72fr)] lg:items-center lg:gap-10">
          <div className="dashboard-hero-copy relative z-10 max-w-2xl">
            <p className="text-sm font-semibold text-brand">
              {billingAvailable && credits !== null
                ? `${credits} ${credits === 1 ? "crédito disponible" : "créditos disponibles"}`
                : "Saldo temporalmente no disponible"}
            </p>
            <h1 className="mt-5 max-w-xl text-balance text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
              {firstName ? `${firstName}, ¿qué ponemos en marcha?` : "¿Qué ponemos en marcha?"}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted">
              Crea una pieza desde cero o retoma una imagen. Las medidas, la calidad
              y el coste se ajustan al destino que elijas.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/create"
                className="dashboard-primary-action inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink transition-transform hover:-translate-y-0.5"
              >
                Crear diseño <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href="/edit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/[0.07] px-5 text-sm font-semibold text-foreground hover:bg-white/[0.11]"
              >
                <PencilLine aria-hidden="true" className="size-4" /> Editar imagen
              </Link>
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-5 text-xs">
              <div>
                <dt className="text-muted">Plan</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {billingAvailable && plan ? planLabels[plan] ?? "Plan activo" : "No disponible"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Saldo</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {billingAvailable && credits !== null ? `${credits} créditos` : "No disponible"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">En curso</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {jobsAvailable ? activeJobs.length || "Ningún trabajo" : "No disponible"}
                </dd>
              </div>
            </dl>
          </div>
          <div aria-hidden="true" className="dashboard-studio-visual relative mt-12 min-h-64 lg:mt-0">
            <div className="dashboard-sheet dashboard-sheet--one">
              <span className="dashboard-sheet-mark">16:9</span>
              <span className="dashboard-sheet-line" />
              <span className="dashboard-sheet-block" />
            </div>
            <div className="dashboard-sheet dashboard-sheet--two">
              <span className="dashboard-sheet-mark">9:16</span>
              <span className="dashboard-sheet-orb" />
            </div>
            <div className="dashboard-sheet dashboard-sheet--three">
              <Sparkles className="size-6 text-brand" />
            </div>
          </div>
        </section>

        <section aria-labelledby="quick-title" className="mt-12">
          <SectionHeading
            id="quick-title"
            title="Creación rápida"
            description="Empieza por el resultado que necesitas."
          />
          <div className="grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {quickCreate.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{ animationDelay: `${index * 55}ms` }}
                  className="dashboard-quick-item group flex min-h-28 items-center gap-4 bg-background p-5 transition-colors hover:bg-white/[0.045]"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/[0.055] text-brand transition-transform group-hover:-translate-y-0.5">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-foreground">{item.label}</span>
                    <span className="mt-1 block text-xs text-muted">{item.detail}</span>
                  </span>
                  <ArrowUpRight aria-hidden="true" className="ml-auto size-4 text-white/30 group-hover:text-brand" />
                </Link>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="jobs-title" className="mt-12">
            <SectionHeading
              id="jobs-title"
              title="Trabajos activos"
              description="El proceso continúa aunque cierres esta pestaña."
            />
            <div className="divide-y divide-white/8 rounded-2xl bg-surface px-5 sm:px-6">
              {!jobsAvailable ? (
                <p className="py-6 text-sm text-muted">
                  No pudimos consultar la cola ahora. Recarga la página para intentarlo de nuevo.
                </p>
              ) : activeJobs.length ? activeJobs.map((job) => (
                <Link
                  key={job.id}
                  href={job.type === "generation" ? `/generations/${job.resourceId}?job=${job.id}` : "/edit"}
                  className="dashboard-job-row group flex min-h-20 items-center gap-4 py-4"
                >
                  <span className="job-pulse grid size-10 shrink-0 place-items-center rounded-xl bg-brand/[0.08] text-brand">
                    <Clock3 aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">
                      {job.type === "generation" ? "Creando una pieza" : "Aplicando cambios"}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                      <span>{jobStatusLabel(job.status)}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={job.createdAt}>{relativeJobTime(job.createdAt)}</time>
                    </span>
                    <span aria-hidden="true" className="mt-2 block h-0.5 overflow-hidden rounded-full bg-white/8">
                      <span className="job-progress-indeterminate block h-full w-1/3 rounded-full bg-brand" />
                    </span>
                  </span>
                  <ArrowUpRight aria-hidden="true" className="size-4 text-white/35 group-hover:text-brand" />
                </Link>
              )) : (
                <div className="flex min-h-20 items-center gap-4 py-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-white/[0.05] text-muted">
                    <Check aria-hidden="true" className="size-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">Todo al día</p>
                    <p className="mt-1 text-xs text-muted">No hay trabajos pendientes.</p>
                  </div>
                </div>
              )}
            </div>
          </section>

        <section aria-labelledby="recent-title" className="mt-12">
          <SectionHeading
            id="recent-title"
            title="Creaciones recientes"
            description="Tus últimos resultados, listos para abrir o editar."
            action={recentGenerations.length ? { href: "/generations", label: "Ver todas" } : undefined}
          />
          {creationsAvailable ? (
            <GenerationGrid items={recentGenerations.slice(0, 8)} compact />
          ) : (
            <div className="rounded-2xl bg-surface px-6 py-8">
              <p className="font-semibold text-foreground">La biblioteca no está disponible ahora.</p>
              <p className="mt-2 text-sm text-muted">
                Tus creaciones siguen guardadas. Recarga la página para consultarlas.
              </p>
            </div>
          )}
        </section>

        <section aria-labelledby="recommended-title" className="mt-14">
          <SectionHeading
            id="recommended-title"
            title="Formatos recomendados"
            description="Puntos de partida útiles para el trabajo de cada día."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recommended.map((item, index) => (
              <Link
                key={item.type}
                href={`/create?type=${item.type}`}
                className="group flex min-h-56 flex-col justify-between overflow-hidden rounded-2xl bg-surface p-5"
              >
                <div className="grid h-28 place-items-center overflow-hidden rounded-xl bg-black/45">
                  <div className={cnShape(item.shape, index)} />
                </div>
                <div className="mt-5">
                  <span className="flex items-center justify-between gap-3 font-semibold text-foreground">
                    {item.label}
                    <ArrowUpRight aria-hidden="true" className="size-4 text-white/35 group-hover:text-brand" />
                  </span>
                  <span className="mt-1 block text-xs text-muted">{item.detail}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <RecentEditSessions
          sessions={recentEditSessions}
          title="Ediciones recientes"
          description="Retoma una conversación sin perder versiones."
        />

      </Container>
    </main>
  );
}

function SectionHeading({
  id,
  title,
  description,
  action,
}: {
  id: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-5">
      <div>
        <h2 id={id} className="text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted">{description}</p>
      </div>
      {action ? (
        <Link href={action.href} className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-muted hover:text-foreground sm:inline-flex">
          {action.label} <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

function cnShape(shape: string, index: number) {
  return `${shape} ${index === 2 ? "h-24" : "h-20"} border border-white/15 bg-[linear-gradient(145deg,rgba(221,245,39,.22),rgba(255,255,255,.04))] shadow-[12px_16px_30px_rgba(0,0,0,.28)]`;
}

function jobStatusLabel(status: string) {
  const labels: Record<string, string> = {
    queued: "En cola",
    claimed: "Preparando",
    processing: "Generando",
    retry_scheduled: "Reintento programado",
  };
  return labels[status] ?? "Procesando";
}

function relativeJobTime(createdAt: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000),
  );
  if (minutes < 1) return "ahora";
  if (minutes === 1) return "hace 1 min";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? "hace 1 h" : `hace ${hours} h`;
}
