"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordInputProps = {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  error?: string;
};

export function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  error,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={8}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`h-12 w-full rounded-[0.7rem] border bg-background px-4 pr-12 text-base text-foreground outline-none transition-[border-color,box-shadow] focus:border-brand/70 focus:shadow-[0_0_0_3px_rgba(221,245,39,0.11)] ${
            error ? "border-red-400/70" : "border-white/[0.14]"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-[0.7rem] text-muted transition-colors hover:text-foreground"
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="size-5" />
          ) : (
            <Eye aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-sm leading-5 text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
