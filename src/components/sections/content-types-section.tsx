import {
  GalleryHorizontal,
  ImageIcon,
  MonitorPlay,
  PanelsTopLeft,
} from "lucide-react";
import Image from "next/image";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { contentTypes } from "@/config/landing";
import { cn } from "@/lib/utils";

const icons = {
  thumbnail: MonitorPlay,
  social: ImageIcon,
  banner: GalleryHorizontal,
  cover: PanelsTopLeft,
} as const;

const layouts = [
  "md:col-span-7",
  "md:col-span-5",
  "md:col-span-5",
  "md:col-span-7",
] as const;

export function ContentTypesSection() {
  return (
    <section id="product" className="scroll-mt-24 py-24 sm:py-32">
      <Container>
        <SectionHeading
          align="center"
          title="Una idea. Diferentes formatos."
          description="Crea las piezas que necesitas sin adaptar cada diseño manualmente desde cero."
        />

        <div className="mt-12 grid gap-4 md:grid-cols-12">
          {contentTypes.map((item, index) => {
            const Icon = icons[item.key];

            return (
              <article
                key={item.key}
                className={cn(
                  "group relative min-h-[24rem] overflow-hidden rounded-2xl bg-surface",
                  layouts[index],
                  index > 1 && "md:min-h-[20rem]",
                )}
              >
                <Image
                  src={item.visual}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 58vw"
                  className="object-cover opacity-62 transition duration-500 ease-out group-hover:scale-[1.02] group-hover:opacity-72"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,8,8,0.98)_0%,rgba(8,8,8,0.52)_48%,rgba(8,8,8,0.1)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <Icon aria-hidden="true" className="size-5 text-brand" />
                    <span className="font-mono text-[0.62rem] tracking-[0.12em] text-white/48">
                      {item.format}
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.025em] text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-white/62">
                    {item.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
