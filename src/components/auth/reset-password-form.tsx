"use client";

import { useActionState } from "react";

import { updatePassword } from "@/app/(auth)/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { initialAuthState } from "@/lib/auth/action-state";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(
    updatePassword,
    initialAuthState,
  );

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <AuthMessage state={state} />
      <PasswordInput
        id="new-password"
        name="password"
        label="Nueva contraseña"
        autoComplete="new-password"
        error={state.fieldErrors?.password}
      />
      <PasswordInput
        id="confirm-new-password"
        name="confirmPassword"
        label="Confirmar nueva contraseña"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword}
      />
      <SubmitButton pendingLabel="Actualizando contraseña…">
        Guardar nueva contraseña
      </SubmitButton>
    </form>
  );
}
