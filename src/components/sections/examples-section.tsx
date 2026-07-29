import Image from "next/image";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { examples } from "@/config/landing";
import { cn } from "@/lib/utils";

export function ExamplesSection() {
  return (
    <section
      id="examples"
      className="section-surface scroll-mt-24 border-y border-white/[0.07] py-24 sm:py-32"
    >
      <Container>
        <SectionHeading
          align="center"
          title="Una dirección para cada mensaje."
          description="Conceptos visuales para distintos ritmos, audiencias y momentos de publicación."
        />

        <div className="reveal-clip mt-12 grid auto-rows-[18rem] gap-4 md:grid-cols-5">
          {examples.map((example) => (
            <figure
              key={example.title}
              className={cn(
                "group relative overflow-hidden rounded-2xl bg-surface",
                example.className,
              )}
            >
              <Image
                src={example.src}
                alt={example.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/95 via-[#080808]/10 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="max-w-md text-xl font-semibold tracking-[-0.025em] text-white">
                  {example.title}
                </h3>
                <p className="mt-2 text-sm text-white/72">
                  {example.description}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-6 text-white/58">
          Imágenes conceptuales creadas para mostrar la amplitud visual de
          Crealy.
        </p>
      </Container>
    </section>
  );
}
