import { ArrowDownRight, Sparkles } from "lucide-react";
import Image from "next/image";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative isolate min-h-[100dvh] overflow-hidden pt-16 sm:pt-[4.5rem]">
      <div aria-hidden="true" className="absolute inset-0">
        <Image
          src="/images/crealy-hero-studio-v2.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero-studio-image object-cover"
        />
        <div className="hero-studio-wash absolute inset-0" />
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
