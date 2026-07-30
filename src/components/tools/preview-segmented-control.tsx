"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type PreviewControlOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

export function PreviewSegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: readonly PreviewControlOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="mb-2 text-xs font-medium text-muted">{label}</legend>
      <div className="flex min-w-0 gap-1 overflow-x-auto rounded-xl bg-white/[0.045] p-1">
        {options.map((option) => {
          const Icon = option.icon;
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-[background-color,color,transform] active:scale-[0.98]",
                active
                  ? "bg-brand text-brand-ink"
                  : "text-muted hover:bg-white/[0.055] hover:text-foreground",
              )}
            >
              {Icon && <Icon className="size-4" aria-hidden="true" />}
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
