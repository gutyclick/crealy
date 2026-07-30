"use client";

import { useEffect, useMemo, useState } from "react";

import { ImageMetadata } from "@/components/tools/image-metadata";
import { ImageWarnings } from "@/components/tools/image-warnings";
import { ToolResultPanel } from "@/components/tools/tool-result-panel";
import { ToolUploadZone } from "@/components/tools/tool-upload-zone";
import type { LocalImage } from "@/types/tools";

export function ImageSizeCheckerClient() {
  const [image, setImage] = useState<LocalImage | null>(null);
  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );
  const warnings = useMemo(() => {
    if (!image) return [];
    const next: string[] = [];
    if (image.width < 1080 || image.height < 1080) {
      next.push("Algún lado tiene menos de 1080 px; revisa el uso final.");
    }
    if (image.bytes > 5 * 1024 * 1024) {
      next.push("El archivo pesa más de 5 MB y podría cargar lentamente.");
    }
    return next;
  }, [image]);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <ToolResultPanel
        title="Selecciona el archivo"
        description="No enviamos la imagen a ningún servidor."
      >
        <ToolUploadZone
          onImage={(next) => {
            if (image) URL.revokeObjectURL(image.url);
            setImage(next);
          }}
        />
      </ToolResultPanel>
      <ToolResultPanel
        title="Ficha técnica"
        description="Datos leídos directamente desde el archivo que elegiste."
      >
        {!image ? (
          <div className="grid min-h-64 place-items-center rounded-xl bg-black/20 text-sm text-muted">
            Aquí aparecerán las medidas y el peso.
          </div>
        ) : (
          <div className="grid gap-5">
            <div className="overflow-hidden rounded-xl bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt="Imagen seleccionada"
                className="max-h-[420px] w-full object-contain"
              />
            </div>
            <ImageMetadata image={image} />
            <ImageWarnings warnings={warnings} />
          </div>
        )}
      </ToolResultPanel>
    </div>
  );
}
