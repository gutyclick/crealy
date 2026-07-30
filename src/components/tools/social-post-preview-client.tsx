"use client";

import { useEffect, useMemo, useState } from "react";

import { ImageMetadata } from "@/components/tools/image-metadata";
import { ImageWarnings } from "@/components/tools/image-warnings";
import { PlatformPreviewFrame } from "@/components/tools/platform-preview-frame";
import { ToolResultPanel } from "@/components/tools/tool-result-panel";
import { ToolUploadZone } from "@/components/tools/tool-upload-zone";
import type { LocalImage } from "@/types/tools";

const platforms = {
  instagramSquare: {
    label: "Instagram · cuadrado",
    ratio: 1,
    recommended: "1080 × 1080",
  },
  instagramPortrait: {
    label: "Instagram · vertical",
    ratio: 4 / 5,
    recommended: "1080 × 1350",
  },
  x: { label: "X", ratio: 16 / 9, recommended: "1600 × 900" },
  linkedin: {
    label: "LinkedIn",
    ratio: 1.91,
    recommended: "1200 × 627",
  },
  facebook: {
    label: "Facebook",
    ratio: 1.91,
    recommended: "1200 × 630",
  },
} as const;

type PlatformId = keyof typeof platforms;

export function SocialPostPreviewClient() {
  const [image, setImage] = useState<LocalImage | null>(null);
  const [platform, setPlatform] = useState<PlatformId>("instagramSquare");
  const [copy, setCopy] = useState(
    "Una idea clara merece un diseño que se entienda a primera vista.",
  );
  const [device, setDevice] = useState<"desktop" | "mobile">("mobile");

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );

  const selected = platforms[platform];
  const warnings = useMemo(() => {
    if (!image) return [];
    if (Math.abs(image.width / image.height - selected.ratio) > 0.04) {
      return [
        `La proporción no coincide con ${selected.label}; parte de la imagen se recortará.`,
      ];
    }
    return [];
  }, [image, selected]);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <ToolResultPanel title="Configura la publicación" className="h-fit">
        <ToolUploadZone
          onImage={(next) => {
            if (image) URL.revokeObjectURL(image.url);
            setImage(next);
          }}
          compact
        />
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Plataforma
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value as PlatformId)}
              className="h-11 rounded-xl bg-[#24251f] px-3 text-foreground outline-none ring-brand focus:ring-2"
            >
              {Object.entries(platforms).map(([id, item]) => (
                <option key={id} value={id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Texto de la publicación
            <textarea
              value={copy}
              maxLength={500}
              rows={4}
              onChange={(event) => setCopy(event.target.value)}
              className="resize-none rounded-xl bg-white/[0.055] p-3.5 text-foreground outline-none ring-brand focus:ring-2"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Dispositivo
            <select
              value={device}
              onChange={(event) =>
                setDevice(event.target.value as "desktop" | "mobile")
              }
              className="h-11 rounded-xl bg-[#24251f] px-3 text-foreground outline-none ring-brand focus:ring-2"
            >
              <option value="mobile">Móvil</option>
              <option value="desktop">Escritorio</option>
            </select>
          </label>
        </div>
      </ToolResultPanel>

      <ToolResultPanel
        title="Vista aproximada"
        description={`Medida sugerida: ${selected.recommended} px. Las interfaces de cada red pueden cambiar.`}
      >
        {!image ? (
          <div className="grid min-h-96 place-items-center rounded-xl bg-black/20 text-sm text-muted">
            Sube un diseño para empezar.
          </div>
        ) : (
          <div className="grid gap-5">
            <ImageMetadata image={image} />
            <ImageWarnings warnings={warnings} />
            <PlatformPreviewFrame label={`${selected.label} · ${device}`}>
              <article
                className={`mx-auto overflow-hidden rounded-xl bg-[#0a0a0a] ${
                  device === "mobile" ? "max-w-sm" : "max-w-xl"
                }`}
              >
                <div className="flex items-center gap-3 p-4">
                  <span className="grid size-9 place-items-center rounded-full bg-brand text-xs font-bold text-brand-ink">
                    C
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Tu marca</p>
                    <p className="text-xs text-white/45">Ahora</p>
                  </div>
                </div>
                <p className="px-4 pb-4 text-sm leading-6 text-white/80">
                  {copy || "Escribe el texto de tu publicación."}
                </p>
                <div
                  className="overflow-hidden bg-black"
                  style={{ aspectRatio: selected.ratio }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt="Vista previa de la publicación"
                    className="size-full object-cover"
                  />
                </div>
                <div className="flex gap-6 px-4 py-3 text-xs text-white/45">
                  <span>Me gusta</span>
                  <span>Comentar</span>
                  <span>Compartir</span>
                </div>
              </article>
            </PlatformPreviewFrame>
          </div>
        )}
      </ToolResultPanel>
    </div>
  );
}
