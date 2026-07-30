"use client";

import { useEffect, useMemo, useState } from "react";

import { ImageMetadata } from "@/components/tools/image-metadata";
import { ImageWarnings } from "@/components/tools/image-warnings";
import { PlatformPreviewFrame } from "@/components/tools/platform-preview-frame";
import { ToolResultPanel } from "@/components/tools/tool-result-panel";
import { ToolUploadZone } from "@/components/tools/tool-upload-zone";
import { estimateImageContrast } from "@/lib/tools/local-image";
import type { LocalImage } from "@/types/tools";

const sizes = [
  { id: "desktop", label: "Inicio · escritorio", width: "max-w-[580px]" },
  { id: "mobile", label: "Inicio · móvil", width: "max-w-[330px]" },
  { id: "search", label: "Resultado de búsqueda", width: "max-w-[420px]" },
  { id: "suggested", label: "Video sugerido", width: "max-w-[260px]" },
  { id: "small", label: "Vista reducida", width: "max-w-[160px]" },
] as const;

export function YoutubeThumbnailPreviewClient() {
  const [image, setImage] = useState<LocalImage | null>(null);
  const [title, setTitle] = useState(
    "Cómo diseñar una miniatura que se entienda en segundos",
  );
  const [channel, setChannel] = useState("Tu canal");
  const [duration, setDuration] = useState("12:48");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [contrast, setContrast] = useState<number | null>(null);

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );
  useEffect(() => {
    if (!image) return;
    let active = true;
    void estimateImageContrast(image.url)
      .then((value) => {
        if (active) setContrast(value);
      })
      .catch(() => {
        if (active) setContrast(null);
      });
    return () => {
      active = false;
    };
  }, [image]);

  const warnings = useMemo(() => {
    if (!image) return [];
    const next: string[] = [];
    if (Math.abs(image.width / image.height - 16 / 9) > 0.025) {
      next.push("La proporción no es 16:9; YouTube puede recortar la imagen.");
    }
    if (image.width < 1280 || image.height < 720) {
      next.push("La resolución es menor a 1280 × 720 px.");
    }
    if (image.bytes > 2 * 1024 * 1024) {
      next.push("El archivo supera 2 MB; comprímelo antes de publicarlo.");
    }
    if (contrast !== null && contrast < 2) {
      next.push(
        "El contraste global parece bajo; revisa texto y sujeto a tamaño pequeño.",
      );
    }
    return next;
  }, [contrast, image]);

  function replaceImage(next: LocalImage) {
    if (image) URL.revokeObjectURL(image.url);
    setContrast(null);
    setImage(next);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <ToolResultPanel
        title="Prepara la simulación"
        description="La imagen se procesa en tu navegador y no se sube."
        className="h-fit"
      >
        <ToolUploadZone onImage={replaceImage} compact />
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Título del video
            <input
              value={title}
              maxLength={100}
              onChange={(event) => setTitle(event.target.value)}
              className="h-11 rounded-xl bg-white/[0.055] px-3.5 text-foreground outline-none ring-brand focus:ring-2"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Canal
            <input
              value={channel}
              maxLength={60}
              onChange={(event) => setChannel(event.target.value)}
              className="h-11 rounded-xl bg-white/[0.055] px-3.5 text-foreground outline-none ring-brand focus:ring-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2 text-sm font-medium">
              Duración
              <input
                value={duration}
                maxLength={8}
                onChange={(event) => setDuration(event.target.value)}
                className="h-11 rounded-xl bg-white/[0.055] px-3.5 text-foreground outline-none ring-brand focus:ring-2"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Tema
              <select
                value={theme}
                onChange={(event) =>
                  setTheme(event.target.value as "dark" | "light")
                }
                className="h-11 rounded-xl bg-[#24251f] px-3 text-foreground outline-none ring-brand focus:ring-2"
              >
                <option value="dark">Oscuro</option>
                <option value="light">Claro</option>
              </select>
            </label>
          </div>
        </div>
      </ToolResultPanel>

      <ToolResultPanel
        title="Cómo se verá"
        description="Estas vistas ayudan a revisar legibilidad y composición; no predicen rendimiento ni CTR."
      >
        {!image ? (
          <div className="grid min-h-96 place-items-center rounded-xl bg-black/25 px-6 text-center text-sm text-muted">
            Sube una imagen para verla en contextos reales de tamaño.
          </div>
        ) : (
          <div className="grid gap-6">
            <ImageMetadata image={image} />
            {contrast !== null && (
              <p className="rounded-xl bg-white/[0.035] px-4 py-3 text-sm text-muted">
                Contraste visual aproximado:{" "}
                <strong className="text-foreground">{contrast.toFixed(1)}:1</strong>.
                Es una lectura global, no una medición WCAG del texto.
              </p>
            )}
            <ImageWarnings warnings={warnings} />
            <div className="grid gap-5 md:grid-cols-2">
              {sizes.map((size) => (
                <PlatformPreviewFrame key={size.id} label={size.label}>
                  <div
                    className={`mx-auto ${size.width} ${
                      theme === "light"
                        ? "rounded-xl bg-[#f6f6f6] p-3 text-[#151515]"
                        : "text-white"
                    }`}
                  >
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt="Vista previa de la miniatura"
                        className="size-full object-cover"
                      />
                      <span className="absolute right-1.5 bottom-1.5 rounded bg-black/90 px-1.5 py-0.5 text-[0.65rem] font-semibold text-white">
                        {duration || "0:00"}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5">
                      {title || "Título del video"}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        theme === "light" ? "text-black/60" : "text-white/55"
                      }`}
                    >
                      {channel || "Tu canal"}
                    </p>
                  </div>
                </PlatformPreviewFrame>
              ))}
            </div>
          </div>
        )}
      </ToolResultPanel>
    </div>
  );
}
