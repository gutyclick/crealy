"use client";

import { useActionState } from "react";

import { resendVerificationEmail } from "@/app/(auth)/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { initialAuthState } from "@/lib/auth/action-state";

export function ResendVerificationForm() {
  const [state, formAction] = useActionState(
    resendVerificationEmail,
    initialAuthState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <AuthMessage state={state} />
      <SubmitButton pendingLabel="Reenviando…">
        Reenviar correo
      </SubmitButton>
    </form>
  );
}
