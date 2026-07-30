"use client";

import { Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ImageMetadata } from "@/components/tools/image-metadata";
import { ImageWarnings } from "@/components/tools/image-warnings";
import { ToolResultPanel } from "@/components/tools/tool-result-panel";
import { ToolUploadZone } from "@/components/tools/tool-upload-zone";
import type { LocalImage } from "@/types/tools";

const presets = {
  youtube: {
    label: "YouTube · banner",
    ratio: 16 / 9,
    recommended: "2560 × 1440",
    safe: { left: 19.8, right: 19.8, top: 35.3, bottom: 35.3 },
  },
  x: {
    label: "X · encabezado",
    ratio: 3,
    recommended: "1500 × 500",
    safe: { left: 8, right: 8, top: 12, bottom: 12 },
  },
  linkedin: {
    label: "LinkedIn · portada",
    ratio: 4,
    recommended: "1584 × 396",
    safe: { left: 12, right: 7, top: 13, bottom: 13 },
  },
  facebook: {
    label: "Facebook · portada",
    ratio: 2.63,
    recommended: "1640 × 624",
    safe: { left: 8, right: 8, top: 15, bottom: 15 },
  },
} as const;

type PresetId = keyof typeof presets;

export function SafeAreaCheckerClient() {
  const [image, setImage] = useState<LocalImage | null>(null);
  const [presetId, setPresetId] = useState<PresetId>("youtube");
  const preset = presets[presetId];

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );
  const warnings = useMemo(() => {
    if (!image) return [];
    return Math.abs(image.width / image.height - preset.ratio) > 0.04
      ? [`La imagen no coincide con la proporción de ${preset.label}.`]
      : [];
  }, [image, preset]);

  const templateHref = `/tools/templates/${presetId}-safe-area.svg`;

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <ToolResultPanel title="Elige una guía" className="h-fit">
        <label className="grid gap-2 text-sm font-medium">
          Plataforma
          <select
            value={presetId}
            onChange={(event) => setPresetId(event.target.value as PresetId)}
            className="h-11 rounded-xl bg-[#24251f] px-3 text-foreground outline-none ring-brand focus:ring-2"
          >
            {Object.entries(presets).map(([id, item]) => (
              <option key={id} value={id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-4 text-sm leading-6 text-muted">
          Tamaño recomendado: {preset.recommended} px.
        </p>
        <div className="mt-5">
          <ToolUploadZone
            onImage={(next) => {
              if (image) URL.revokeObjectURL(image.url);
              setImage(next);
            }}
            compact
          />
        </div>
        <Button
          href={templateHref}
          download
          variant="secondary"
          className="mt-4 w-full"
        >
          <Download className="size-4" aria-hidden />
          Descargar guía SVG
        </Button>
      </ToolResultPanel>

      <ToolResultPanel
        title="Zona visible"
        description="Mantén los elementos imprescindibles dentro del rectángulo verde."
      >
        {!image ? (
          <div
            className="relative mx-auto max-w-3xl overflow-hidden rounded-xl bg-[#1b1c17]"
            style={{ aspectRatio: preset.ratio }}
          >
            <div
              className="absolute border border-brand bg-brand/[0.07]"
              style={preset.safe}
            />
          </div>
        ) : (
          <div className="grid gap-5">
            <ImageMetadata image={image} />
            <ImageWarnings warnings={warnings} />
            <div
              className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-xl bg-black"
              style={{ aspectRatio: preset.ratio }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={`Comprobación de zona segura para ${preset.label}`}
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-black/35" />
              <div
                className="absolute border-2 border-brand bg-transparent shadow-[0_0_0_999px_rgba(0,0,0,0.2)]"
                style={preset.safe}
              >
                <span className="absolute top-2 left-2 rounded bg-brand px-2 py-1 text-[0.65rem] font-bold text-brand-ink">
                  Contenido seguro
                </span>
              </div>
            </div>
          </div>
        )}
      </ToolResultPanel>
    </div>
  );
}
