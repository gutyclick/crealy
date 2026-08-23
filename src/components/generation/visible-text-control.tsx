"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { GenerationTextMode } from "@/types/generation";

type VisibleTextControlProps = {
  idPrefix: string;
  mode: GenerationTextMode | null;
  value: string;
  onModeChange: (mode: GenerationTextMode) => void;
  onValueChange: (value: string) => void;
  exactTextHint?: string;
  exactTextPlaceholder?: string;
  automaticOnly?: boolean;
  modeError?: string;
  textError?: string;
};

const textSources = [
  {
    id: "automatic" as const,
    label: "Texto automático",
    description: "Crealy extrae una frase breve y relevante del brief.",
  },
  {
    id: "custom" as const,
    label: "Texto exacto",
    description: "Escribimos exactamente lo que indiques.",
  },
];

export function VisibleTextControl({
  idPrefix,
  mode,
  value,
  onModeChange,
  onValueChange,
  exactTextHint = "Usa una frase breve y fácil de leer.",
  exactTextPlaceholder = "Ej. Crea más. Publica mejor.",
  automaticOnly = false,
  modeError,
  textError,
}: VisibleTextControlProps) {
  const usesText = mode === "automatic" || mode === "custom";

  return (
    <fieldset className="mt-7">
      <legend className="text-sm font-semibold text-foreground">
        ¿Quieres texto visible?
      </legend>
      <p className="mt-1.5 text-xs leading-5 text-muted">
        Esta elección es obligatoria y define si aparecerán palabras en el diseño.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Usar texto visible">
        {[
          { value: true, label: "Sí, usar texto" },
          { value: false, label: "No, sin texto" },
        ].map((option) => {
          const selected = option.value ? usesText : mode === "none";
          return (
            <button
              key={String(option.value)}
              type="button"
              aria-pressed={selected}
              onClick={() => onModeChange(option.value ? "automatic" : "none")}
              className={cn(
                "flex min-h-12 items-center justify-between rounded-xl px-4 text-left text-sm font-semibold outline-none ring-1 transition-colors focus-visible:ring-2 focus-visible:ring-brand",
                selected
                  ? "bg-brand/[0.09] text-foreground ring-brand/65"
                  : "bg-background text-muted ring-white/10 hover:bg-white/[0.055] hover:text-foreground",
              )}
            >
              {option.label}
              {selected ? <Check aria-hidden="true" className="size-4 text-brand" /> : null}
            </button>
          );
        })}
      </div>

      {usesText && automaticOnly ? (
        <div className="mt-3 rounded-xl bg-white/[0.035] px-4 py-3 ring-1 ring-white/10">
          <p className="text-sm font-semibold text-foreground">Redacción automática</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Crealy convertirá tu descripción en un mensaje breve. Incluye allí cualquier
            nombre, teléfono o dato que deba aparecer.
          </p>
        </div>
      ) : usesText ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {textSources.map((option) => {
            const selected = mode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onModeChange(option.id)}
                className={cn(
                  "min-h-[4.75rem] rounded-xl p-3.5 text-left outline-none ring-1 transition-colors focus-visible:ring-2 focus-visible:ring-brand",
                  selected
                    ? "bg-white/[0.055] ring-brand/55"
                    : "bg-background ring-white/10 hover:bg-white/[0.04]",
                )}
              >
                <span className="block text-sm font-semibold text-foreground">{option.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">{option.description}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {mode === "custom" ? (
        <div className="mt-3">
          <label htmlFor={`${idPrefix}-exact-text`} className="sr-only">Texto exacto</label>
          <input
            id={`${idPrefix}-exact-text`}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            maxLength={120}
            placeholder={exactTextPlaceholder}
            className="h-12 w-full rounded-xl bg-background px-4 text-base text-foreground outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-2 focus:ring-brand/65"
          />
          <p className="mt-2 text-xs leading-5 text-muted">{exactTextHint}</p>
        </div>
      ) : null}

      {modeError ? <p role="alert" className="mt-2 text-xs text-red-200">{modeError}</p> : null}
      {textError ? <p role="alert" className="mt-2 text-xs text-red-200">{textError}</p> : null}
    </fieldset>
  );
}
