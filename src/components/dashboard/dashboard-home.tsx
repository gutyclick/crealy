import {
  ArrowUpRight,
  Clock3,
  Image,
  MonitorPlay,
  PanelsTopLeft,
  PencilLine,
  RectangleHorizontal,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { GenerationGrid } from "@/components/generation/generation-grid";
import { Container } from "@/components/layout/container";
import type { GenerationListItem } from "@/types/generation";
import type { RecentEditSession } from "@/types/editing";
import { RecentEditSessions } from "@/components/editing/recent-edit-sessions";

export function DashboardHome({
  firstName,
  recentGenerations,
  recentEditSessions,
  activeJobs,
  plan,
  credits,
  onboardingChecklist,
}: {
  firstName?: string;
  recentGenerations: GenerationListItem[];
  recentEditSessions: RecentEditSession[];
  activeJobs: Array<{
    id: string;
    type: string;
    status: string;
    resourceId: string;
    createdAt: string;
  }>;
  plan: string;
  credits: number;
  onboardingChecklist: {
    emailConfirmed: boolean;
    profileCompleted: boolean;
    onboardingCompleted: boolean;
    firstDesignCreated: boolean;
    editorTried: boolean;
  };
}) {
  const quickCreate = [
    { href: "/create?type=youtube-thumbnail", label: "Miniatura de YouTube", description: "1920 × 1080", icon: MonitorPlay },
    { href: "/create?type=social-post", label: "Post para redes", description: "Cuadrado o vertical", icon: Image },
    { href: "/create?type=banner", label: "Banner", description: "Formato panorámico", icon: RectangleHorizontal },
    { href: "/create?type=social-cover", label: "Portada", description: "Elige la plataforma", icon: PanelsTopLeft },
  ] as const;
  const checklist = [
    {
      label: "Confirmar correo",
      done: onboardingChecklist.emailConfirmed,
      href: "/verify-email",
    },
    {
      label: "Completar perfil",
      done: onboardingChecklist.profileCompleted,
      href: "/settings/profile",
    },
    {
      label: "Completar preferencias",
      done: onboardingChecklist.onboardingCompleted,
      href: "/onboarding",
    },
    {
      label: "Crear primer diseño",
      done: onboardingChecklist.firstDesignCreated,
      href: "/create",
    },
    {
      label: "Probar el editor",
      done: onboardingChecklist.editorTried,
      href: "/edit",
    },
    {
      label: "Explorar herramientas",
      done: false,
      href: "/tools",
    },
  ] as const;
  const completedChecklistItems = checklist.filter((item) => item.done).length;
  return (
    <main className="py-10 sm:py-14">
      <Container>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-brand">Tu espacio creativo</p>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
            {firstName ? `Hola, ${firstName}.` : "Hola."}
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted">
            ¿Qué quieres crear hoy?
          </p>
        </div>

        {completedChecklistItems < 5 && (
          <section className="mt-8 border-y border-white/10 py-6" aria-labelledby="first-steps-title">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 id="first-steps-title" className="text-lg font-semibold text-foreground">
                  Completa tus primeros pasos
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {completedChecklistItems} de {checklist.length} listos. Puedes seguir creando sin completarlos todos.
                </p>
              </div>
              <div className="flex max-w-3xl flex-wrap gap-2">
                {checklist.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`inline-flex min-h-10 items-center rounded-lg border px-3 text-xs font-semibold ${
                      item.done
                        ? "border-white/8 text-white/40 line-through"
                        : "border-white/12 text-muted hover:border-white/25 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

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
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/create" className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink transition hover:-translate-y-0.5 hover:bg-[var(--brand-hover)]">
                Crear nuevo diseño <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href="/edit" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-semibold text-foreground hover:bg-white/[0.05]">
                <PencilLine aria-hidden="true" className="size-4" /> Editar una imagen
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="quick-create-title" className="mt-10">
          <div className="mb-5">
            <h2 id="quick-create-title" className="text-xl font-semibold text-foreground">Creación rápida</h2>
            <p className="mt-1 text-sm text-muted">Empieza por el destino; el tamaño correcto viene incluido.</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {quickCreate.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="group min-h-36 bg-background p-5 transition-colors hover:bg-white/[0.035]">
                  <Icon aria-hidden="true" className="size-5 text-brand" />
                  <span className="mt-7 block font-semibold text-foreground">{item.label}</span>
                  <span className="mt-1 block text-xs text-muted">{item.description}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {activeJobs.length ? <section aria-labelledby="active-jobs-title" className="mt-10">
          <div className="mb-5">
            <h2 id="active-jobs-title" className="text-xl font-semibold text-foreground">
              Trabajos en curso
            </h2>
            <p className="mt-1 text-sm text-muted">
              Puedes cerrar la pestaña; el trabajo continúa en segundo plano.
            </p>
          </div>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {activeJobs.map((job) => (
                <Link
                  key={job.id}
                  href={job.type === "generation" ? `/generations/${job.resourceId}?job=${job.id}` : "/edit"}
                  className="flex min-h-16 items-center gap-4 py-3 text-sm hover:text-brand"
                >
                  <Clock3 aria-hidden="true" className="size-4 shrink-0 text-brand" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">
                      {job.type === "generation" ? "Creando diseño" : "Aplicando cambios"}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {job.status === "retry_scheduled" ? "Reintento programado" : "Procesando de forma segura"}
                    </span>
                  </span>
                  <ArrowUpRight aria-hidden="true" className="size-4 text-muted" />
                </Link>
              ))}
            </div>
        </section> : null}

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
        <RecentEditSessions sessions={recentEditSessions} />
        <section className="mt-10 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Plan y créditos</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">{plan === "free" ? "Plan Free" : `Plan ${plan}`}</h2>
            <p className="mt-1 text-sm text-muted">{credits} créditos disponibles.</p>
          </div>
          <Link href="/settings/billing" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-foreground hover:bg-white/[0.05]">
            Administrar plan
          </Link>
        </section>
      </Container>
    </main>
  );
}
