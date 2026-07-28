import {
  ArrowUpRight,
  Image as ImageIcon,
  LayoutPanelTop,
  MonitorPlay,
  RectangleHorizontal,
} from "lucide-react";

import { Container } from "@/components/layout/container";

const contentTypes = [
  { label: "Miniatura", format: "16:9", icon: MonitorPlay },
  { label: "Post para redes", format: "1:1", icon: ImageIcon },
  { label: "Banner", format: "3:1", icon: RectangleHorizontal },
  { label: "Portada", format: "4:5", icon: LayoutPanelTop },
] as const;

export function DashboardHome({ firstName }: { firstName?: string }) {
  return (
    <main className="py-10 sm:py-14">
      <Container>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-brand">Tu espacio creativo</p>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
            {firstName ? `Hola, ${firstName}.` : "Hola."}
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted">
            Todo está preparado para que empieces cuando se active la creación
            de contenido.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface p-6 sm:p-8">
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-20 size-64 rounded-full bg-brand/[0.055] blur-3xl"
            />
            <div className="relative">
              <span className="inline-flex rounded-full border border-brand/25 bg-brand/[0.06] px-3 py-1 text-xs font-semibold text-brand">
                Próxima fase
              </span>
              <h2 className="mt-16 max-w-sm text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
                Crear nuevo diseño
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-muted sm:text-base sm:leading-7">
                Describe una idea y conviértela en una pieza visual adaptada al
                formato que necesites.
              </p>
              <button
                type="button"
                disabled
                className="mt-7 inline-flex h-12 items-center gap-2 rounded-[0.7rem] bg-white/[0.06] px-5 text-sm font-semibold text-white/42"
              >
                Disponible en la próxima fase
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          </section>

          <section
            aria-labelledby="formats-title"
            className="rounded-2xl border border-white/10 bg-surface p-6"
          >
            <h2
              id="formats-title"
              className="text-lg font-semibold text-foreground"
            >
              Tipos de contenido
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[0.8rem] border border-white/[0.08] bg-white/[0.08]">
              {contentTypes.map(({ label, format, icon: Icon }) => (
                <div key={label} className="min-h-32 bg-background p-4">
                  <Icon aria-hidden="true" className="size-5 text-brand" />
                  <p className="mt-8 text-sm font-semibold text-foreground">
                    {label}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted">{format}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section
          aria-labelledby="recent-projects-title"
          className="mt-4 rounded-2xl border border-white/10 bg-surface px-6 py-12 text-center sm:px-8 sm:py-16"
        >
          <div className="mx-auto grid size-11 place-items-center rounded-[0.8rem] bg-white/[0.055]">
            <ImageIcon aria-hidden="true" className="size-5 text-white/55" />
          </div>
          <h2
            id="recent-projects-title"
            className="mt-5 text-xl font-semibold text-foreground"
          >
            Todavía no tienes proyectos.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">
            Tus creaciones aparecerán aquí cuando generes tu primer diseño.
          </p>
        </section>
      </Container>
    </main>
  );
}
