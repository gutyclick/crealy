"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordReset } from "@/app/(auth)/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { initialAuthState } from "@/lib/auth/action-state";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    requestPasswordReset,
    initialAuthState,
  );

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <AuthMessage state={state} />
      {state.status !== "success" && (
        <>
          <FormField
            id="recovery-email"
            name="email"
            type="email"
            label="Correo electrónico"
            autoComplete="email"
            inputMode="email"
            required
            defaultValue={state.values?.email}
            error={state.fieldErrors?.email}
          />
          <SubmitButton pendingLabel="Enviando enlace…">
            Enviar enlace de recuperación
          </SubmitButton>
        </>
      )}
      <Link
        href="/login"
        className="text-center text-sm font-semibold text-foreground transition-colors hover:text-brand"
      >
        Volver a iniciar sesión
      </Link>
    </form>
  );
}
