"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { signUp } from "@/app/(auth)/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { FormField } from "@/components/auth/form-field";
import { AuthDivider, SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { initialAuthState } from "@/lib/auth/action-state";
import { trackConversion } from "@/lib/analytics/events";

export function SignupForm({ inviteRequired = false, nextPath = "/dashboard", googleEnabled = false, discordEnabled = false, inviteError = false }: { inviteRequired?: boolean; nextPath?: string; googleEnabled?: boolean; discordEnabled?: boolean; inviteError?: boolean }) {
  const [state, formAction] = useActionState(signUp, initialAuthState);
  const [inviteCode, setInviteCode] = useState("");

  return (
    <div className="grid gap-5">
      {inviteRequired ? (
        <div>
          <FormField
            id="signup-invite-code"
            name="inviteCodeDisplay"
            type="text"
            label="Código de invitación"
            autoComplete="off"
            minLength={12}
            maxLength={160}
            required
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            error={state.fieldErrors?.inviteCode || (inviteError ? "El código no está disponible o ha expirado." : undefined)}
          />
          <p className="mt-2 text-xs leading-5 text-muted">
            Se aplicará al método de registro que elijas.
          </p>
        </div>
      ) : null}
      {googleEnabled || discordEnabled ? (
        <>
          <SocialAuthButtons
            nextPath={nextPath}
            flow="signup"
            inviteCode={inviteCode}
            inviteRequired={inviteRequired}
            googleEnabled={googleEnabled}
            discordEnabled={discordEnabled}
          />
          <AuthDivider />
        </>
      ) : null}
      <form action={formAction} onSubmit={() => trackConversion("signup_started")} className="grid gap-5" noValidate>
      <input type="hidden" name="next" value={nextPath} />
      {inviteRequired ? <input type="hidden" name="inviteCode" value={inviteCode} /> : null}
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
    </div>
  );
}
