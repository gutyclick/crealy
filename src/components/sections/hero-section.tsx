import { ArrowRight, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const proofs = [
  { className: "proof-grid", label: "NUEVO FORMATO", accent: "POST" },
  { className: "proof-orbit", label: "IDEA EN FOCO", accent: "STORY" },
  { className: "proof-editorial", label: "LANZAMIENTO", accent: "POST" },
  { className: "proof-signal", label: "HAZLO VISIBLE", accent: "PORTADA" },
  { className: "proof-stacks", label: "TU MARCA", accent: "CARRUSEL" },
  { className: "proof-type", label: "CREA. PUBLICA.", accent: "ANUNCIO" },
] as const;

function ThumbnailProof({
  className,
  label,
  accent,
}: (typeof proofs)[number]) {
  return (
    <div className={cn("thumbnail-proof", className)}>
      <span className="absolute left-3 top-3 font-mono text-[0.55rem] tracking-[0.12em] text-white/70">
        {accent}
      </span>
      <span className="absolute bottom-3 left-3 max-w-[72%] text-[0.78rem] font-semibold leading-tight text-white">
        {label}
      </span>
    </div>
  );
}

function ThumbnailBackdrop() {
  const repeatedProofs = [...proofs, ...proofs];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-16 h-[34rem] overflow-hidden opacity-35 sm:top-20 sm:h-[38rem]"
    >
      <div className="absolute left-1/2 top-10 w-[130%] -translate-x-1/2 -rotate-[5deg] space-y-4">
        <div className="thumbnail-track">
          {repeatedProofs.map((proof, index) => (
            <ThumbnailProof key={`top-${index}`} {...proof} />
          ))}
        </div>
        <div className="thumbnail-track thumbnail-track-reverse -translate-x-24">
          {repeatedProofs.map((proof, index) => (
            <ThumbnailProof key={`bottom-${index}`} {...proof} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AbstractResult({
  format,
  className,
  children,
}: {
  format: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative min-h-40 overflow-hidden rounded-[0.8rem] border border-white/10 bg-[#111] p-4 sm:min-h-52",
        className,
      )}
    >
      <span className="relative z-10 font-mono text-[0.6rem] tracking-[0.13em] text-white/55">
        {format}
      </span>
      {children}
    </div>
  );
}

function ProductPreview() {
  return (
    <section
      id="product"
      aria-label="Vista provisional del futuro producto"
      className="brand-glow relative mx-auto mt-14 w-full max-w-5xl scroll-mt-24 overflow-hidden rounded-2xl border border-white/[0.12] bg-surface/95 text-left sm:mt-18"
    >
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-brand" />
          <span className="text-xs font-medium text-white/72">Nuevo diseño</span>
        </div>
        <span className="font-mono text-[0.62rem] tracking-[0.12em] text-white/38">
          VISTA PROVISIONAL
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[0.72fr_1.28fr] lg:gap-5">
        <div className="flex min-h-56 flex-col rounded-xl bg-[#0c0c0c] p-4 ring-1 ring-white/[0.08] sm:min-h-64 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles aria-hidden="true" className="size-4 text-brand" />
            Describe tu idea
          </div>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted">
            Una publicación limpia para presentar una nueva colección.
          </p>
          <div className="mt-5 min-h-24 rounded-lg border border-white/[0.1] bg-white/[0.025] px-3.5 py-3 text-sm text-white/45">
            Convierte esta idea en una pieza visual…
          </div>
          <button
            type="button"
            disabled
            className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-[0.65rem] border border-white/[0.12] bg-white/[0.035] px-4 text-sm font-semibold text-white/48"
          >
            Próximamente
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        </div>

        <div id="examples" className="grid scroll-mt-24 grid-cols-2 gap-3">
          <AbstractResult
            format="POST · 1:1"
            className="col-span-2 sm:col-span-1"
          >
            <div className="absolute inset-x-4 bottom-4 top-10">
              <div className="absolute right-0 top-0 size-24 rounded-full bg-brand sm:size-32" />
              <p className="absolute bottom-1 left-0 max-w-32 text-2xl font-semibold leading-[0.92] tracking-[-0.04em] text-white sm:text-3xl">
                Una idea.
                <br />
                Bien contada.
              </p>
            </div>
          </AbstractResult>

          <AbstractResult format="STORY · 9:16" className="sm:row-span-2">
            <div className="absolute inset-x-4 bottom-4 top-12">
              <div className="h-1.5 w-12 bg-brand" />
              <p className="mt-5 text-xl font-semibold leading-tight text-white sm:text-2xl">
                Haz visible
                <br />
                lo que haces.
              </p>
              <div className="absolute inset-x-0 bottom-0 h-16 rounded-t-full border border-white/15 bg-white/[0.04]" />
            </div>
          </AbstractResult>

          <AbstractResult format="PORTADA · 16:9">
            <div className="absolute -bottom-10 -right-8 size-36 rotate-12 rounded-[2.2rem] bg-brand" />
            <p className="absolute bottom-4 left-4 max-w-28 text-lg font-semibold leading-tight text-white">
              Listo para compartir.
            </p>
          </AbstractResult>
        </div>
      </div>
    </section>
  );
}

export function HeroSection() {
  return (
    <section className="relative isolate min-h-screen overflow-hidden pt-16 sm:pt-[4.5rem]">
      <ThumbnailBackdrop />
      <div
        aria-hidden="true"
        className="hero-vignette pointer-events-none absolute inset-0 z-[1]"
      />

      <Container className="relative z-10 flex flex-col items-center pb-20 pt-28 text-center sm:pb-28 sm:pt-36 lg:pt-40">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-black/45 px-3 py-1.5 text-xs font-medium text-white/78 backdrop-blur-sm">
          <Sparkles aria-hidden="true" className="size-3.5 text-brand" />
          Creación visual con IA
        </div>

        <h1 className="mt-6 max-w-[14ch] text-balance text-[clamp(2.75rem,8vw,6rem)] font-semibold leading-[0.94] tracking-[-0.04em] text-foreground">
          Convierte tus ideas en contenido visual.
        </h1>

        <p className="mt-6 max-w-[39rem] text-balance text-base leading-7 text-white/66 sm:text-lg sm:leading-8">
          Una experiencia sencilla y directa para llevar cada idea hasta una
          pieza visual lista para compartir.
        </p>

        <div className="mt-8 flex w-full flex-col justify-center gap-3 min-[420px]:w-auto min-[420px]:flex-row">
          <Button href="#product" size="lg">
            Explorar el concepto
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <Button href="#examples" variant="secondary" size="lg">
            Ver ejemplos
          </Button>
        </div>

        <ProductPreview />
      </Container>
    </section>
  );
}
