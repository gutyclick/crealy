"use client";

import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Upload } from "lucide-react";

import { cn } from "@/lib/utils";
import { readLocalImage } from "@/lib/tools/local-image";
import type { LocalImage } from "@/types/tools";
import { trackToolEvent } from "@/components/tools/tool-analytics";

type ToolUploadZoneProps = {
  onImage: (image: LocalImage) => void;
  label?: string;
  compact?: boolean;
};

export function ToolUploadZone({
  onImage,
  label = "Elige una imagen",
  compact = false,
}: ToolUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file?: File) {
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      onImage(await readLocalImage(file));
      trackToolEvent("upload");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "No pudimos leer la imagen.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
        className={cn(
          "group flex w-full flex-col items-center justify-center rounded-2xl border border-dashed text-center transition-[border-color,background-color,transform]",
          compact ? "min-h-40 p-5" : "min-h-64 p-8",
          dragging
            ? "scale-[0.995] border-brand bg-brand/[0.07]"
            : "border-white/18 bg-white/[0.018] hover:border-white/35 hover:bg-white/[0.035]",
        )}
      >
        <span className="grid size-12 place-items-center rounded-xl bg-white/[0.06] text-brand transition-transform group-hover:-translate-y-0.5">
          {loading ? (
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          ) : compact ? (
            <ImagePlus className="size-5" aria-hidden="true" />
          ) : (
            <Upload className="size-5" aria-hidden="true" />
          )}
        </span>
        <span className="mt-4 text-sm font-semibold text-foreground">{label}</span>
        <span className="mt-1 text-xs leading-5 text-muted">
          JPG, PNG o WebP · máximo 8 MB
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
