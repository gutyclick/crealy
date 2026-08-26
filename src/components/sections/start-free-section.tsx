import { ArrowRight, ImageIcon, MonitorPlay, PanelsTopLeft } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

const outputs = [
  { label: "Miniatura", detail: "16:9", icon: MonitorPlay },
  { label: "Post", detail: "1:1", icon: ImageIcon },
  { label: "Portada", detail: "16:9", icon: PanelsTopLeft },
] as const;

export function StartFreeSection() {
  return (
    <section className="py-14 sm:py-24" aria-labelledby="start-free-title">
      <Container>
        <div className="start-free-stage reveal-clip relative isolate overflow-hidden rounded-2xl border border-white/[0.1] bg-surface-elevated px-5 py-10 sm:px-10 sm:py-14 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)] lg:items-center lg:gap-12 lg:px-14">
          <div className="relative z-10 text-center lg:text-left">
            <h2 id="start-free-title" className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              Tu idea no tiene que quedarse en una nota.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted lg:mx-0">
              Escríbela como la tienes en mente. Crealy te ayuda a convertirla
              en una pieza lista para publicar.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 min-[420px]:flex-row min-[420px]:justify-center lg:justify-start">
              <Button href="/signup" size="lg" className="start-free-action">
                Crear mi primer diseño
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
              <span className="text-sm text-white/58">Gratis · sin tarjeta</span>
            </div>
          </div>

          <div className="relative mt-10 min-h-64 lg:mt-0" aria-hidden="true">
            <div className="absolute inset-x-[8%] top-8 h-px bg-white/10">
              <span className="start-free-signal absolute top-1/2 size-2 -translate-y-1/2 rounded-full bg-brand shadow-[0_0_18px_rgba(221,245,39,0.55)]" />
            </div>
            <div className="relative mx-auto flex max-w-lg flex-col items-center">
              <div className="relative z-10 w-full max-w-sm rounded-xl border border-white/12 bg-background px-4 py-3.5 text-left shadow-[var(--shadow-panel)]">
                <span className="block text-xs text-white/46">Tu idea</span>
                <span className="mt-1 block pr-5 text-sm font-medium text-foreground sm:text-base">
                  “Quiero que esta historia se sienta imposible de ignorar”
                </span>
                <span className="absolute bottom-3.5 right-4 size-2 rounded-full bg-brand" />
              </div>

              <div className="mt-10 grid w-full grid-cols-3 gap-2 sm:gap-3">
                {outputs.map(({ label, detail, icon: Icon }, index) => (
                  <div key={label} className="start-free-output rounded-xl border border-white/10 bg-background/88 p-3 text-left shadow-[var(--shadow-panel)] sm:p-4" style={{ animationDelay: `${180 + index * 110}ms` }}>
                    <div className="flex items-center justify-between gap-2">
                      <Icon className="size-4 text-brand" />
                      <span className="font-mono text-[0.6rem] text-white/46">{detail}</span>
                    </div>
                    <div className="mt-8 h-1.5 w-3/4 rounded-full bg-white/14" />
                    <div className="mt-2 h-1.5 w-1/2 rounded-full bg-brand/80" />
                    <span className="mt-4 block text-xs font-medium text-white/74">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
