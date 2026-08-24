import { ArrowDownRight, Sparkles } from "lucide-react";
import Image from "next/image";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type CreativePiece = {
  src: string;
  format: "wide" | "square" | "cover" | "banner";
  position?: string;
};

const firstRail: CreativePiece[] = [
  { src: "/images/hero/crealy-hero-miniaturas (1).webp", format: "wide" },
  { src: "/images/hero/crealy-hero-miniaturas (3).webp", format: "wide" },
  { src: "/images/hero/crealy-hero-post-vertical.webp", format: "square" },
  { src: "/images/hero/crealy-hero banner.webp", format: "banner" },
  { src: "/images/hero/crealy-hero-miniaturas (4).webp", format: "wide" },
];

const secondRail: CreativePiece[] = [
  { src: "/images/hero/crealy-hero-miniaturas (5).webp", format: "wide" },
  { src: "/images/hero/crealy-hero-miniaturas (6).webp", format: "wide" },
  { src: "/images/hero/crealy-hero-miniaturas (7).webp", format: "wide" },
  { src: "/images/hero/crealy-hero-miniaturas (2).webp", format: "wide" },
  { src: "/images/hero/crealy-hero-miniaturas (9).webp", format: "wide" },
];

function CreativeRail({
  pieces,
  reverse = false,
  prioritizeFirst = false,
}: {
  pieces: CreativePiece[];
  reverse?: boolean;
  prioritizeFirst?: boolean;
}) {
  return (
    <div className={`hero-gallery-rail${reverse ? " hero-gallery-rail--reverse" : ""}`}>
      <div className="hero-gallery-track">
        {[...pieces, ...pieces].map((piece, index) => (
          <div
            className={`hero-gallery-card hero-gallery-card--${piece.format}`}
            key={`${piece.src}-${piece.format}-${index}`}
          >
            <Image
              src={piece.src}
              alt=""
              fill
              loading={prioritizeFirst && index === 0 ? "eager" : "lazy"}
              fetchPriority={prioritizeFirst && index === 0 ? "high" : "auto"}
              priority={prioritizeFirst && index === 0}
              sizes={
                piece.format === "banner"
                  ? "(max-width: 640px) 64vw, 28vw"
                  : piece.format === "wide"
                    ? "(max-width: 640px) 52vw, 22vw"
                    : "(max-width: 640px) 32vw, 14vw"
              }
              className={`object-cover ${piece.position ?? "object-center"}`}
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative isolate min-h-[100dvh] overflow-hidden pt-16 sm:pt-[4.5rem]">
      <div aria-hidden="true" className="hero-gallery absolute inset-0">
        <CreativeRail pieces={firstRail} prioritizeFirst />
        <CreativeRail pieces={secondRail} reverse />
        <div className="hero-gallery-wash absolute inset-0" />
        <div className="hero-focus-frame absolute left-1/2 top-1/2 h-[62%] w-[min(82vw,62rem)] -translate-x-1/2 -translate-y-1/2 rounded-[1.4rem]" />
      </div>

      <Container className="relative flex min-h-[calc(100dvh-4.5rem)] flex-col items-center justify-center pb-16 pt-16 text-center sm:pb-20 sm:pt-20">
        <div className="hero-copy flex flex-col items-center">
          <Badge className="border-white/15 bg-background/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <Sparkles aria-hidden="true" className="mr-2 size-3.5 text-brand" />
            Tu mesa creativa con IA
          </Badge>

          <h1 className="mt-6 max-w-[13ch] text-balance text-[clamp(3rem,7.2vw,6rem)] font-semibold leading-[0.94] tracking-[-0.04em] text-foreground">
            De la idea a la publicación.
          </h1>

          <p className="mt-6 max-w-[35rem] text-balance text-base leading-7 text-white/76 sm:text-lg sm:leading-8">
            Crea miniaturas, posts y banners sin plantillas interminables ni un
            editor complejo.
          </p>

          <div className="mt-8 flex w-full flex-col justify-center gap-3 min-[420px]:w-auto min-[420px]:flex-row">
            <Button href="#preview" size="lg">
              Ver cómo funciona
              <ArrowDownRight aria-hidden="true" className="size-4" />
            </Button>
            <Button href="/signup" variant="secondary" size="lg">
              Crear cuenta
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
