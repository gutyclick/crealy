import { ArrowRight, Sparkles } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const proofs = [
  { className: "proof-grid", label: "NUEVO FORMATO", accent: "POST" },
  { className: "proof-orbit", label: "IDEA EN FOCO", accent: "STORY" },
  { className: "proof-editorial", label: "LANZAMIENTO", accent: "POST" },
  { className: "proof-signal", label: "HAZLO VISIBLE", accent: "PORTADA" },
  { className: "proof-stacks", label: "TU MENSAJE", accent: "BANNER" },
  { className: "proof-type", label: "LISTO PARA VER", accent: "MINIATURA" },
] as const;

function ThumbnailProof({
  className,
  label,
  accent,
}: (typeof proofs)[number]) {
  return (
    <div className={cn("thumbnail-proof", className)}>
      <span className="absolute left-3 top-3 font-mono text-[0.625rem] tracking-[0.12em] text-white/60">
        {accent}
      </span>
      <span className="absolute bottom-3 left-3 max-w-[72%] text-xs font-semibold leading-tight text-white/85">
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
      className="pointer-events-none absolute inset-x-0 top-16 h-[31rem] overflow-hidden opacity-30 sm:top-20 sm:h-[35rem]"
    >
      <div className="absolute left-1/2 top-10 w-[130%] -translate-x-1/2 -rotate-[4deg] space-y-4">
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

export function HeroSection() {
  return (
    <section className="relative isolate min-h-[100dvh] overflow-hidden pt-16 sm:pt-[4.5rem]">
      <ThumbnailBackdrop />
      <div
        aria-hidden="true"
        className="hero-vignette pointer-events-none absolute inset-0 z-[1]"
      />

      <Container className="relative z-10 flex min-h-[calc(100dvh-4.5rem)] flex-col items-center justify-center pb-20 pt-20 text-center sm:pb-24 sm:pt-24">
        <Badge>
          <Sparkles aria-hidden="true" className="mr-2 size-3.5 text-brand" />
          Contenido visual creado con IA
        </Badge>

        <h1 className="mt-6 max-w-[13ch] text-balance text-[clamp(2.8rem,7.2vw,5.7rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-foreground">
          Crea contenido que llama la atención.
        </h1>

        <p className="mt-6 max-w-[37rem] text-balance text-base leading-7 text-white/68 sm:text-lg sm:leading-8">
          Crea miniaturas, banners y posts sin empezar de cero ni saber de
          diseño.
        </p>

        <div className="mt-8 flex w-full flex-col justify-center gap-3 min-[420px]:w-auto min-[420px]:flex-row">
          <Button href="#pricing" size="lg">
            Empezar a crear
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <Button href="#examples" variant="secondary" size="lg">
            Ver ejemplos
          </Button>
        </div>
      </Container>
    </section>
  );
}
