"use client";

import { useEffect, useMemo, useState } from "react";

import { ImageMetadata } from "@/components/tools/image-metadata";
import { ImageWarnings } from "@/components/tools/image-warnings";
import { PlatformPreviewFrame } from "@/components/tools/platform-preview-frame";
import { ToolResultPanel } from "@/components/tools/tool-result-panel";
import { ToolUploadZone } from "@/components/tools/tool-upload-zone";
import type { LocalImage } from "@/types/tools";

const bannerViews = [
  { id: "tv", label: "TV · lienzo completo", crop: "100%", height: "auto" },
  { id: "desktop", label: "Escritorio", crop: "100%", height: "34%" },
  { id: "tablet", label: "Tableta", crop: "72%", height: "34%" },
  { id: "mobile", label: "Móvil", crop: "48%", height: "34%" },
] as const;

export function YoutubeBannerPreviewClient() {
  const [image, setImage] = useState<LocalImage | null>(null);
  const [guides, setGuides] = useState(true);

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );

  const warnings = useMemo(() => {
    if (!image) return [];
    const next: string[] = [];
    if (Math.abs(image.width / image.height - 16 / 9) > 0.025) {
      next.push("El banner recomendado usa proporción 16:9.");
    }
    if (image.width < 2560 || image.height < 1440) {
      next.push("Para mayor nitidez, prepara el banner en 2560 × 1440 px.");
    }
    if (image.bytes > 6 * 1024 * 1024) {
      next.push("El archivo supera los 6 MB recomendados por YouTube.");
    }
    return next;
  }, [image]);

  return (
    <div className="grid gap-6">
      <ToolResultPanel
        title="Carga tu banner"
        description="Todo el cálculo de recortes se realiza localmente."
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <ToolUploadZone
            onImage={(next) => {
              if (image) URL.revokeObjectURL(image.url);
              setImage(next);
            }}
            compact
          />
          <div className="rounded-xl bg-white/[0.035] p-5">
            <p className="text-sm font-semibold">Guía de trabajo</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Mantén texto y logotipos dentro del área central de 1546 × 423 px.
            </p>
            <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 text-sm">
              Mostrar área segura
              <input
                type="checkbox"
                checked={guides}
                onChange={(event) => setGuides(event.target.checked)}
                className="size-4 accent-[var(--brand)]"
              />
            </label>
          </div>
        </div>
      </ToolResultPanel>

      {image && (
        <ToolResultPanel
          title="Recortes por dispositivo"
          description="Los recortes son aproximaciones visuales para revisar la composición."
        >
          <div className="grid gap-5">
            <ImageMetadata image={image} />
            <ImageWarnings warnings={warnings} />
            <div className="grid gap-5 md:grid-cols-2">
              {bannerViews.map((view) => (
                <PlatformPreviewFrame key={view.id} label={view.label}>
                  <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-black">
                    <div
                      className="relative overflow-hidden"
                      style={{
                        width: view.crop,
                        height: view.height,
                        aspectRatio: view.id === "tv" ? "16 / 9" : undefined,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={`Vista de banner en ${view.label}`}
                        className="absolute inset-0 size-full object-cover"
                      />
                      {guides && view.id === "tv" && (
                        <span className="absolute top-[35.3%] right-[19.8%] bottom-[35.3%] left-[19.8%] border border-brand bg-brand/[0.06]">
                          <span className="absolute top-2 left-2 rounded bg-black/75 px-2 py-1 text-[0.6rem] font-semibold text-brand">
                            Área segura
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </PlatformPreviewFrame>
              ))}
            </div>
          </div>
        </ToolResultPanel>
      )}
    </div>
  );
}
