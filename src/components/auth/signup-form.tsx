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

export function SignupForm({ inviteRequired = false, nextPath = "/dashboard", googleEnabled = false, discordEnabled = false, inviteError = false, termsError = false, consentError = false }: { inviteRequired?: boolean; nextPath?: string; googleEnabled?: boolean; discordEnabled?: boolean; inviteError?: boolean; termsError?: boolean; consentError?: boolean }) {
  const [state, formAction] = useActionState(signUp, initialAuthState);
  const [inviteCode, setInviteCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  return (
    <div className="grid gap-5">
      {consentError ? (
        <p role="alert" className="rounded-xl border border-red-300/20 bg-red-300/5 px-4 py-3 text-sm leading-6 text-red-200">
          No pudimos guardar tus preferencias. Inténtalo nuevamente.
        </p>
      ) : null}
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
      <div className="grid gap-2">
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl px-1 py-2 text-sm leading-6 text-foreground">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]"
            aria-describedby={state.fieldErrors?.terms || termsError ? "signup-terms-error" : undefined}
          />
          <span>
            Acepto los{" "}
            <Link href="/terms" target="_blank" className="underline underline-offset-2 hover:text-brand">
              términos de uso
            </Link>{" "}
            y la{" "}
            <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-brand">
              política de privacidad
            </Link>.
          </span>
        </label>
        {state.fieldErrors?.terms || termsError ? (
          <p id="signup-terms-error" role="alert" className="px-1 text-sm leading-5 text-red-300">
            {state.fieldErrors?.terms || "Debes aceptar los términos y la política de privacidad."}
          </p>
        ) : null}
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl px-1 py-2 text-sm leading-6 text-muted">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(event) => setMarketingOptIn(event.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]"
          />
          <span>
            Quiero recibir novedades y noticias de Crealy. Es opcional y puedo darme de baja cuando quiera.
          </span>
        </label>
      </div>
      {googleEnabled || discordEnabled ? (
        <>
          <SocialAuthButtons
            nextPath={nextPath}
            flow="signup"
            inviteCode={inviteCode}
            inviteRequired={inviteRequired}
            termsAccepted={termsAccepted}
            marketingOptIn={marketingOptIn}
            googleEnabled={googleEnabled}
            discordEnabled={discordEnabled}
          />
          <AuthDivider />
        </>
      ) : null}
      <form action={formAction} onSubmit={() => trackConversion("signup_started")} className="grid gap-5" noValidate>
      <input type="hidden" name="next" value={nextPath} />
      {inviteRequired ? <input type="hidden" name="inviteCode" value={inviteCode} /> : null}
      <input type="hidden" name="termsAccepted" value={termsAccepted ? "on" : ""} />
      <input type="hidden" name="marketingOptIn" value={marketingOptIn ? "on" : ""} />
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
      <SubmitButton pendingLabel="Creando cuenta…" disabled={!termsAccepted}>
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
