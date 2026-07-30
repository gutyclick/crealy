"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ToolResultPanel } from "@/components/tools/tool-result-panel";
import { ToolUploadZone } from "@/components/tools/tool-upload-zone";
import { formatBytes } from "@/lib/tools/local-image";
import type { LocalImage } from "@/types/tools";

export function ThumbnailComparatorClient() {
  const [images, setImages] = useState<LocalImage[]>([]);
  const imagesRef = useRef<LocalImage[]>([]);

  useEffect(() => {
    return () =>
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
  }, []);

  function addImage(image: LocalImage) {
    setImages((current) => {
      if (current.length >= 3) {
        URL.revokeObjectURL(image.url);
        return current;
      }
      const next = [...current, image];
      imagesRef.current = next;
      return next;
    });
  }

  function removeImage(index: number) {
    setImages((current) => {
      URL.revokeObjectURL(current[index].url);
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      imagesRef.current = next;
      return next;
    });
  }

  return (
    <div className="grid gap-6">
      <ToolResultPanel
        title="Añade de dos a tres opciones"
        description="La comparación es visual y local; no atribuye una probabilidad de clic."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image.url}
              className="relative overflow-hidden rounded-xl bg-black"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={`Opción ${index + 1}`}
                className="aspect-video size-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                aria-label={`Quitar opción ${index + 1}`}
                className="absolute top-2 right-2 grid size-11 place-items-center rounded-full bg-black/80 text-white transition-colors hover:bg-black"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ))}
          {images.length < 3 && (
            <ToolUploadZone
              onImage={addImage}
              label={
                images.length === 0 ? "Añadir primera opción" : "Añadir opción"
              }
              compact
            />
          )}
        </div>
      </ToolResultPanel>

      {images.length >= 2 && (
        <>
          <ToolResultPanel
            title="Lectura a tamaño normal"
            description="Busca una idea dominante, una jerarquía evidente y diferencias reales entre variantes."
          >
            <div
              className={`grid gap-4 ${
                images.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"
              }`}
            >
              {images.map((image, index) => (
                <figure key={image.url}>
                  <div className="overflow-hidden rounded-xl bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={`Miniatura ${index + 1}`}
                      className="aspect-video size-full object-cover"
                    />
                  </div>
                  <figcaption className="mt-3 flex justify-between text-xs text-muted">
                    <span>Opción {index + 1}</span>
                    <span>
                      {image.width} × {image.height} · {formatBytes(image.bytes)}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </ToolResultPanel>
          <ToolResultPanel
            title="Prueba de tamaño reducido"
            description="Si el mensaje desaparece aquí, simplifica texto, fondo o número de elementos."
          >
            <div className="flex flex-wrap items-start justify-center gap-8">
              {images.map((image, index) => (
                <figure key={image.url} className="w-40">
                  <div className="overflow-hidden rounded-lg bg-black shadow-[0_16px_35px_rgba(0,0,0,0.3)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={`Opción ${index + 1} reducida`}
                      className="aspect-video size-full object-cover"
                    />
                  </div>
                  <figcaption className="mt-2 text-center text-xs text-muted">
                    Opción {index + 1}
                  </figcaption>
                </figure>
              ))}
            </div>
          </ToolResultPanel>
        </>
      )}
      {images.length < 2 && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
          <Plus className="size-4" aria-hidden />
          Añade al menos dos imágenes para compararlas.
        </div>
      )}
    </div>
  );
}
