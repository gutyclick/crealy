import {
  GalleryHorizontal,
  ImageIcon,
  MonitorPlay,
  PanelsTopLeft,
} from "lucide-react";

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

const ratios = {
  thumbnail: "aspect-video w-20",
  social: "aspect-square w-12",
  banner: "aspect-[3/1] w-24",
  cover: "aspect-[4/5] w-11",
} as const;

export function ContentTypesSection() {
  return (
    <section id="product" className="scroll-mt-24 py-24 sm:py-32">
      <Container>
        <SectionHeading
          align="center"
          title="Una idea. Todos tus formatos."
          description="Mantén una misma dirección visual mientras preparas contenido para cada canal."
        />

        <div className="reveal-rise mx-auto mt-14 grid max-w-6xl overflow-hidden rounded-2xl border border-white/[0.1] bg-surface/62 md:grid-cols-2 xl:grid-cols-4">
          {contentTypes.map((item, index) => {
            const Icon = icons[item.key];

            return (
              <article
                key={item.key}
                className={cn(
                  "group relative flex min-h-72 flex-col items-center justify-between p-7 text-center sm:p-8",
                  index > 0 && "border-t border-white/[0.09] md:border-t-0",
                  index === 1 && "md:border-l",
                  index === 2 && "md:border-t xl:border-l xl:border-t-0",
                  index === 3 && "md:border-l md:border-t xl:border-t-0",
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <Icon aria-hidden="true" className="size-5 text-brand" />
                  <span className="font-mono text-xs text-white/55">
                    {item.format}
                  </span>
                </div>

                <div
                  aria-hidden="true"
                  className={cn(
                    "relative my-8 overflow-hidden rounded-[0.55rem] border border-white/15 bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-[transform,border-color,background-color] duration-300 ease-out group-hover:-translate-y-1 group-hover:border-brand/55 group-hover:bg-brand/10",
                    ratios[item.key],
                  )}
                >
                  <span className="absolute inset-x-2 bottom-2 h-1 rounded-full bg-white/12" />
                  <span className="absolute bottom-2 left-2 h-1 w-1/3 rounded-full bg-brand" />
                </div>

                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.025em] text-foreground">
                    {item.title}
                  </h3>
                  <p className="mx-auto mt-3 max-w-[17rem] text-sm leading-6 text-muted">
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
