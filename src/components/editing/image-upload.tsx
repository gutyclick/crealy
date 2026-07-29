"use client";

import { ImagePlus, LoaderCircle, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT = "image/png,image/jpeg,image/webp";

export function ImageUpload({
  available,
  maxFileMb,
}: {
  available: boolean;
  maxFileMb: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (selection) URL.revokeObjectURL(selection.preview);
    };
  }, [selection]);

  function choose(next: File | null) {
    setError(null);
    if (!next) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(next.type)) {
      setError("Usa una imagen PNG, JPEG o WebP.");
      return;
    }
    if (next.size > maxFileMb * 1024 * 1024) {
      setError(`La imagen no puede superar ${maxFileMb} MB.`);
      return;
    }
    setSelection({
      file: next,
      preview: URL.createObjectURL(next),
    });
  }

  async function upload() {
    if (!selection || loading) return;
    setLoading(true);
    setError(null);
    const data = new FormData();
    data.set("image", selection.file);

    try {
      const response = await fetch("/api/uploads/images", {
        method: "POST",
        body: data,
      });
      const result = (await response.json()) as {
        sessionId?: string;
        error?: string;
      };
      if (!response.ok || !result.sessionId) {
        throw new Error(result.error || "No pudimos subir la imagen.");
      }
      router.push(`/edit/${result.sessionId}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No pudimos subir la imagen.",
      );
      setLoading(false);
    }
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-surface p-3 transition-[border-color,background-color] sm:p-4",
        dragging ? "border-brand/70 bg-brand/[0.035]" : "border-white/10",
      )}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setDragging(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        choose(event.dataTransfer.files[0] ?? null);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => choose(event.target.files?.[0] ?? null)}
      />

      {selection ? (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="grid min-h-72 place-items-center overflow-hidden rounded-xl bg-[#050505]">
            {/* Local object URL. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selection.preview}
              alt="Vista previa de la imagen seleccionada"
              className="max-h-[58vh] w-full object-contain"
            />
          </div>
          <div className="flex flex-col justify-between p-2 sm:p-3">
            <div>
              <span className="grid size-10 place-items-center rounded-xl bg-brand text-brand-ink">
                <ImagePlus aria-hidden="true" className="size-5" />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-foreground">
                Lista para editar
              </h2>
              <p className="mt-2 break-words text-sm text-muted">
                {selection.file.name}
              </p>
              <p className="mt-1 text-xs text-white/55">
                {(selection.file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            <div className="mt-8 grid gap-2">
              <Button
                type="button"
                onClick={upload}
                disabled={!available || loading}
                className="w-full"
              >
                {loading ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : (
                  <Upload aria-hidden="true" className="size-4" />
                )}
                {loading ? "Preparando edición…" : "Empezar a editar"}
              </Button>
              <button
                type="button"
                onClick={() => setSelection(null)}
                disabled={loading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-muted hover:bg-white/[0.04] hover:text-foreground"
              >
                <X aria-hidden="true" className="size-4" />
                Elegir otra
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={!available}
          onClick={() => inputRef.current?.click()}
          className="group grid min-h-[24rem] w-full place-items-center rounded-xl border border-dashed border-white/15 bg-[#090a08] px-6 text-center transition-[border-color,background-color] hover:border-brand/45 hover:bg-brand/[0.025] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>
            <span className="mx-auto grid size-12 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-brand transition-transform duration-300 group-hover:-translate-y-1">
              <Upload aria-hidden="true" className="size-5" />
            </span>
            <span className="mt-5 block text-lg font-semibold text-foreground">
              Arrastra una imagen o selecciónala
            </span>
            <span className="mt-2 block text-sm leading-6 text-muted">
              PNG, JPEG o WebP · hasta {maxFileMb} MB
            </span>
          </span>
        </button>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error} Revisa el archivo e inténtalo otra vez.
        </p>
      ) : null}
      {!available ? (
        <p className="mt-3 text-sm text-amber-200">
          La edición está temporalmente en mantenimiento.
        </p>
      ) : null}
    </section>
  );
}
