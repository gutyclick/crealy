"use client";

import { Check, Eye, EyeOff } from "lucide-react";
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
  const [value, setValue] = useState("");
  const errorId = `${id}-error`;
  const showStrength = autoComplete === "new-password" && name === "password";
  const requirements = [
    { label: "8 caracteres", met: value.length >= 8 },
    { label: "una mayúscula", met: /[A-Z]/.test(value) },
    { label: "un número", met: /\d/.test(value) },
  ];
  const strength = requirements.filter((item) => item.met).length;

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
          value={value}
          onChange={(event) => setValue(event.target.value)}
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
      {showStrength ? (
        <div className="mt-3" aria-live="polite">
          <div className="grid grid-cols-3 gap-1" aria-hidden="true">
            {[1, 2, 3].map((level) => (
              <span
                key={level}
                className={`h-1 rounded-full ${strength >= level ? "bg-brand" : "bg-white/10"}`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--text-meta)]">
            Usa al menos:
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {requirements.map((requirement) => (
              <li
                key={requirement.label}
                className={`flex items-center gap-1 text-xs ${requirement.met ? "text-[var(--state-success)]" : "text-muted"}`}
              >
                <Check aria-hidden="true" className="size-3.5" />
                {requirement.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {error && (
        <p id={errorId} className="mt-2 text-sm leading-5 text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
