"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signUp } from "@/app/(auth)/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { initialAuthState } from "@/lib/auth/action-state";
import { trackConversion } from "@/lib/analytics/events";

export function SignupForm({ inviteRequired = false, nextPath = "/dashboard" }: { inviteRequired?: boolean; nextPath?: string }) {
  const [state, formAction] = useActionState(signUp, initialAuthState);

  return (
    <form
      action={formAction}
      onSubmit={() => trackConversion("signup_started")}
      className="grid gap-5"
      noValidate
    >
      <input type="hidden" name="next" value={nextPath} />
      <AuthMessage state={state} />
      <FormField
        id="signup-name"
        name="name"
        type="text"
        label="Nombre"
        autoComplete="name"
        minLength={2}
        maxLength={60}
        required
        defaultValue={state.values?.name}
        error={state.fieldErrors?.name}
      />
      {inviteRequired && (
        <FormField
          id="signup-invite-code"
          name="inviteCode"
          type="text"
          label="Código de invitación"
          autoComplete="off"
          minLength={12}
          maxLength={160}
          required
          error={state.fieldErrors?.inviteCode}
        />
      )}
      <FormField
        id="signup-email"
        name="email"
        type="email"
        label="Correo electrónico"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <PasswordInput
        id="signup-password"
        name="password"
        label="Contraseña"
        autoComplete="new-password"
        error={state.fieldErrors?.password}
      />
      <PasswordInput
        id="signup-confirm-password"
        name="confirmPassword"
        label="Confirmar contraseña"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword}
      />
      <p className="text-xs leading-5 text-white/65">
        Al crear tu cuenta aceptas los{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
          términos de uso
        </Link>{" "}
        y la{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          política de privacidad
        </Link>{" "}
        de Crealy.
      </p>
      <SubmitButton pendingLabel="Creando cuenta…">
        Crear cuenta
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        ¿Ya tienes una cuenta?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="font-semibold text-foreground transition-colors hover:text-brand"
        >
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
