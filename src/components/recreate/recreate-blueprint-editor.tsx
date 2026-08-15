"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";

import type { RecreateBlueprint } from "@/types/recreate";

const EDITABLE_FIELDS = [
  { id: "composition", label: "Composición", rows: 2 },
  { id: "hierarchy", label: "Jerarquía", rows: 2 },
  { id: "visualStyle", label: "Estilo visual", rows: 2 },
  { id: "background", label: "Fondo", rows: 2 },
  { id: "emotion", label: "Emoción y energía", rows: 2 },
] as const;

export function RecreateBlueprintEditor({
  blueprint,
  disabled,
  onChange,
}: {
  blueprint: RecreateBlueprint;
  disabled: boolean;
  onChange: (blueprint: RecreateBlueprint) => void;
}) {
  return (
    <details className="group border-t border-white/8">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2.5">
          <SlidersHorizontal aria-hidden="true" className="size-4 text-brand" />
          Ver y ajustar la estructura detectada
          <span className="hidden font-normal text-muted sm:inline">
            · opcional
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-muted transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-white/8 px-5 pb-6 pt-5 sm:px-6">
        <p className="max-w-2xl text-xs leading-5 text-muted">
          Esta lectura guía la composición final. Ajusta solo aquello que Crealy
          no haya interpretado correctamente en la referencia.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {EDITABLE_FIELDS.map((field) => (
            <label
              key={field.id}
              className={field.id === "composition" ? "sm:col-span-2" : ""}
            >
              <span className="text-xs font-semibold text-foreground">
                {field.label}
              </span>
              <textarea
                value={blueprint[field.id]}
                rows={field.rows}
                maxLength={500}
                disabled={disabled}
                onChange={(event) =>
                  onChange({
                    ...blueprint,
                    [field.id]: event.target.value,
                  })
                }
                className="mt-2 w-full resize-y rounded-xl bg-background px-3.5 py-3 text-sm leading-5 text-foreground outline-none ring-1 ring-white/10 transition-shadow focus:ring-brand/65 disabled:opacity-50"
              />
            </label>
          ))}
        </div>
      </div>
    </details>
  );
}
