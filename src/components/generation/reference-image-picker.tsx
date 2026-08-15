"use client";

import { Check, Clock3, ImagePlus, LoaderCircle, X } from "lucide-react";
import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import { useRef, useState } from "react";

import { MAX_GENERATION_REFERENCE_IMAGES } from "@/config/generation";
import { cn } from "@/lib/utils";
import type { RecreateReferenceRole } from "@/types/recreate";

export type ReferenceDraft = {
  key: string;
  file: File;
  previewUrl: string;
  uploadId?: string;
  recreateRole?: RecreateReferenceRole;
  status: "ready" | "uploading" | "uploaded" | "error";
};

const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function ReferenceImagePicker({
  references,
  setReferences,
  maxFileMb,
  maxFiles = MAX_GENERATION_REFERENCE_IMAGES,
  disabled,
}: {
  references: ReferenceDraft[];
  setReferences: Dispatch<SetStateAction<ReferenceDraft[]>>;
  maxFileMb: number;
  maxFiles?: number;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function addFiles(files: File[]) {
    setError(null);
    const remaining = maxFiles - references.length;
    if (remaining <= 0) {
      setError(maxFiles === 1 ? "Ya seleccionaste una foto." : `Ya seleccionaste el máximo de ${maxFiles} referencias.`);
      return;
    }

    const accepted: ReferenceDraft[] = [];
    for (const file of files.slice(0, remaining)) {
      if (!ACCEPTED_TYPES.has(file.type)) {
        setError("Usa únicamente imágenes PNG, JPEG o WebP.");
        continue;
      }
      if (file.size > maxFileMb * 1024 * 1024) {
        setError(`Cada imagen puede pesar hasta ${maxFileMb} MB.`);
        continue;
      }
      const duplicate = [...references, ...accepted].some(
        (item) =>
          item.file.name === file.name &&
          item.file.size === file.size &&
          item.file.lastModified === file.lastModified,
      );
      if (duplicate) {
        setError("Una de esas imágenes ya está seleccionada.");
        continue;
      }
      accepted.push({
        key: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "ready",
      });
    }

    if (files.length > remaining) {
      setError(maxFiles === 1 ? "Puedes usar una sola foto." : `Puedes usar un máximo de ${maxFiles} imágenes.`);
    }
    if (accepted.length) {
      setReferences((current) => [...current, ...accepted]);
    }
  }

  function remove(reference: ReferenceDraft) {
    URL.revokeObjectURL(reference.previewUrl);
    setReferences((current) =>
      current.filter((item) => item.key !== reference.key),
    );
    setError(null);
  }

  return (
    <fieldset className="mt-7">
      <div className="flex items-end justify-between gap-4">
        <legend className="text-sm font-semibold text-foreground">
          {maxFiles === 1 ? "Tu foto" : "Personas, productos o referencias"}{" "}
          <span className="font-normal text-muted">(opcional)</span>
        </legend>
        <span className="text-xs text-white/45">{references.length}/{maxFiles}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">
        {maxFiles === 1
          ? "Si subes una foto, será la protagonista e intentaremos conservar tu identidad."
          : "Crealy intentará preservar identidad y rasgos distintivos, salvo que pidas cambiarlos expresamente en el brief."}
      </p>
      <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-white/55">
        <Clock3 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-brand" />
        <span>
          Las referencias se eliminan automáticamente del servidor 7 días después
          de subirlas. <Link href="/terms" className="text-foreground underline decoration-white/30 hover:decoration-brand">Ver política</Link>
        </span>
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {references.map((reference, index) => (
          <div
            key={reference.key}
            className="group relative aspect-square overflow-hidden rounded-xl border border-white/12 bg-background"
          >
            {/* Local object URL. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reference.previewUrl}
              alt={`Referencia ${index + 1}: ${reference.file.name}`}
              className="size-full object-cover"
            />
            <span className="absolute bottom-1.5 left-1.5 grid size-6 place-items-center rounded-lg bg-black/75 text-xs font-semibold text-white">
              {index + 1}
            </span>
            {reference.status === "uploading" ? (
              <span className="absolute inset-0 grid place-items-center bg-black/60">
                <LoaderCircle
                  aria-label="Subiendo referencia"
                  className="size-5 animate-spin text-brand"
                />
              </span>
            ) : reference.status === "uploaded" ? (
              <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-lg bg-brand text-brand-ink">
                <Check aria-label="Referencia lista" className="size-3.5" />
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => remove(reference)}
              disabled={disabled}
              aria-label={`Quitar ${reference.file.name}`}
              className={cn(
                "absolute right-0 top-0 grid size-11 place-items-center text-white",
                reference.status === "uploaded"
                  ? "sm:opacity-75 sm:transition-opacity sm:hover:opacity-100 sm:focus-visible:opacity-100"
                  : "",
              )}
            >
              <span className="grid size-7 place-items-center rounded-lg bg-black/80">
                <X aria-hidden="true" className="size-4" />
              </span>
            </button>
          </div>
        ))}

        {references.length < maxFiles ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="group grid aspect-square place-items-center rounded-xl border border-dashed border-white/15 bg-background text-center transition-colors hover:border-brand/45 hover:bg-brand/[0.025] disabled:opacity-45"
          >
            <span>
              <ImagePlus
                aria-hidden="true"
                className="mx-auto size-5 text-white/50 group-hover:text-brand"
              />
              <span className="mt-1.5 block text-xs font-medium text-muted">
                Añadir
              </span>
            </span>
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs leading-5 text-red-300">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
