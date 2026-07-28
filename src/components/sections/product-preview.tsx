import {
  ArrowRight,
  ChevronDown,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/ui/logo";

const resultImages = [
  {
    src: "/images/examples/technology.webp",
    alt: "Propuesta visual de tecnología con un dispositivo transparente",
    label: "Miniatura",
  },
  {
    src: "/images/examples/productivity.webp",
    alt: "Propuesta visual de productividad con un escritorio ordenado",
    label: "Post",
  },
  {
    src: "/images/examples/podcast.webp",
    alt: "Propuesta visual para podcast con micrófono de estudio",
    label: "Portada",
  },
] as const;

export function ProductPreview() {
  return (
    <section
      id="preview"
      aria-labelledby="preview-title"
      className="scroll-mt-24 pb-24 sm:pb-32"
    >
      <Container>
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-brand">Vista conceptual</p>
          <h2
            id="preview-title"
            className="mt-3 text-balance text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl"
          >
            Un flujo guiado, sin un panel lleno de controles.
          </h2>
        </div>

        <div className="brand-glow mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/[0.12] bg-surface">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <Logo compact className="text-sm" />
              <span className="hidden h-4 w-px bg-white/10 sm:block" />
              <span className="hidden text-xs text-white/58 sm:inline">
                Miniatura de productividad
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-white/[0.05] px-3 py-1.5 text-[0.625rem] text-white/52 sm:inline">
                Producto en desarrollo
              </span>
              <span
                aria-label="Perfil de ejemplo"
                className="size-7 rounded-full border border-white/15 bg-[linear-gradient(135deg,#3a3a3a,#141414)]"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
            <div className="border-b border-white/[0.08] p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles aria-hidden="true" className="size-4 text-brand" />
                Describe tu idea
              </div>

              <div className="mt-5 grid gap-4">
                <div>
                  <span className="text-xs font-medium text-white/58">
                    Tipo de contenido
                  </span>
                  <div className="mt-2 flex h-11 items-center justify-between rounded-[0.7rem] border border-white/[0.1] bg-white/[0.025] px-3.5 text-sm text-foreground">
                    <span className="flex items-center gap-2">
                      <ImageIcon
                        aria-hidden="true"
                        className="size-4 text-brand"
                      />
                      Miniatura para YouTube
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className="size-4 text-muted"
                    />
                  </div>
                </div>

                <label htmlFor="concept-prompt" className="text-xs font-medium text-white/58">
                  Tu idea
                </label>
                <textarea
                  id="concept-prompt"
                  readOnly
                  value="Una miniatura sobre productividad, con contraste alto, un escritorio moderno y espacio para un título grande."
                  className="min-h-32 resize-none rounded-[0.7rem] border border-white/[0.1] bg-white/[0.025] px-3.5 py-3 text-sm leading-6 text-white/76 outline-none"
                />

                <div>
                  <span className="text-xs font-medium text-white/58">
                    Formato
                  </span>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {["16:9", "1:1", "4:5"].map((format, index) => (
                      <span
                        key={format}
                        className={
                          index === 0
                            ? "rounded-lg border border-brand/55 bg-brand/10 px-3 py-2 text-center text-xs font-medium text-brand"
                            : "rounded-lg border border-white/[0.08] px-3 py-2 text-center text-xs text-muted"
                        }
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  aria-describedby="generator-status"
                  className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-[0.7rem] bg-brand px-5 text-sm font-semibold text-brand-ink disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Generar
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
                <p id="generator-status" className="text-center text-xs text-white/38">
                  Demostración visual. La generación estará disponible después.
                </p>
              </div>
            </div>

            <div className="bg-[#0c0c0c] p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Propuestas
                </p>
                <span className="text-xs text-white/38">3 resultados</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {resultImages.map((result, index) => (
                  <figure
                    key={result.src}
                    className={
                      index === 0
                        ? "group relative min-h-52 overflow-hidden rounded-xl sm:col-span-2 sm:min-h-64"
                        : "group relative min-h-48 overflow-hidden rounded-xl"
                    }
                  >
                    <Image
                      src={result.src}
                      alt={result.alt}
                      fill
                      sizes={
                        index === 0
                          ? "(max-width: 1024px) 100vw, 55vw"
                          : "(max-width: 640px) 100vw, 28vw"
                      }
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/8 to-transparent" />
                    <figcaption className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                      <span className="text-sm font-semibold text-white">
                        {result.label}
                      </span>
                      <span className="font-mono text-[0.6rem] tracking-[0.12em] text-white/56">
                        EJEMPLO
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
