import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function FormField({
  id,
  label,
  error,
  className,
  ...props
}: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "h-12 w-full rounded-[0.7rem] border border-white/[0.14] bg-background px-4 text-base text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-white/32 focus:border-brand/70 focus:shadow-[0_0_0_3px_rgba(221,245,39,0.11)]",
          error && "border-red-400/70",
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-2 text-sm leading-5 text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
