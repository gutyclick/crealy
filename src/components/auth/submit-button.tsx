"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: string;
  pendingLabel: string;
  disabled?: boolean;
};

export function SubmitButton({
  children,
  pendingLabel,
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[0.7rem] border border-transparent bg-brand px-5 text-sm font-semibold text-brand-ink transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-55"
    >
      {pending && (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      )}
      {pending ? pendingLabel : children}
    </button>
  );
}
