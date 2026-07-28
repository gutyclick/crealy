import Image from "next/image";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { examples } from "@/config/landing";
import { cn } from "@/lib/utils";

export function ExamplesSection() {
  return (
    <section
      id="examples"
      className="scroll-mt-24 border-y border-white/[0.07] bg-surface/25 py-24 sm:py-32"
    >
      <Container>
        <SectionHeading
          align="center"
          title="Contenido pensado para destacar."
          description="Explora algunas de las piezas visuales que podrás preparar con Crealy."
        />

        <div className="mt-12 grid auto-rows-[17rem] gap-4 md:grid-cols-4">
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
                className="object-cover transition duration-500 ease-out group-hover:scale-[1.025]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/8 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-lg font-semibold text-white">
                  {example.title}
                </h3>
                <p className="mt-1 text-sm text-white/62">
                  {example.description}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-white/38">
          Imágenes conceptuales creadas para mostrar la dirección del producto.
        </p>
      </Container>
    </section>
  );
}
