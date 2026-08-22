"use client";

import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";

import { signUp } from "@/app/(auth)/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { FormField } from "@/components/auth/form-field";
import {
  DiscordMark,
  GoogleMark,
  SocialAuthButtons,
} from "@/components/auth/social-auth-buttons";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { initialAuthState } from "@/lib/auth/action-state";
import { trackConversion } from "@/lib/analytics/events";

type SignupMethod = "email" | "google" | "discord";

type SignupFormProps = {
  inviteRequired?: boolean;
  nextPath?: string;
  googleEnabled?: boolean;
  discordEnabled?: boolean;
  inviteError?: boolean;
  termsError?: boolean;
  consentError?: boolean;
  oauthError?: "cancelled" | "provider";
};

function MethodOption({
  icon,
  label,
  detail,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-16 w-full items-center gap-4 rounded-[var(--radius-panel)] border border-white/[0.12] bg-white/[0.025] px-4 py-3 text-left transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand active:translate-y-0"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-white/[0.055]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-muted">{detail}</span>
      </span>
      <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </button>
  );
}

function ConsentFields({
  termsAccepted,
  marketingOptIn,
  setTermsAccepted,
  setMarketingOptIn,
  termsError,
}: {
  termsAccepted: boolean;
  marketingOptIn: boolean;
  setTermsAccepted: (value: boolean) => void;
  setMarketingOptIn: (value: boolean) => void;
  termsError?: string;
}) {
  return (
    <div className="grid gap-2 border-t border-white/10 pt-4">
      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl px-1 py-2 text-sm leading-6 text-foreground">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(event) => setTermsAccepted(event.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]"
          aria-describedby={termsError ? "signup-terms-error" : undefined}
        />
        <span>
          Acepto los{" "}
          <Link href="/terms" target="_blank" className="underline underline-offset-2 hover:text-brand">términos de uso</Link>{" "}
          y la{" "}
          <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-brand">política de privacidad</Link>.
        </span>
      </label>
      {termsError ? <p id="signup-terms-error" role="alert" className="px-1 text-sm leading-5 text-red-300">{termsError}</p> : null}
      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl px-1 py-2 text-sm leading-6 text-muted">
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(event) => setMarketingOptIn(event.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]"
        />
        <span>Quiero recibir novedades útiles de Crealy. Es opcional y puedo darme de baja cuando quiera.</span>
      </label>
    </div>
  );
}

const methodLabels: Record<SignupMethod, string> = {
  email: "Correo electrónico",
  google: "Google",
  discord: "Discord",
};

export function SignupForm({
  inviteRequired = false,
  nextPath = "/dashboard",
  googleEnabled = false,
  discordEnabled = false,
  inviteError = false,
  termsError = false,
  consentError = false,
  oauthError,
}: SignupFormProps) {
  const [state, formAction] = useActionState(signUp, initialAuthState);
  const [method, setMethod] = useState<SignupMethod | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const visibleTermsError = state.fieldErrors?.terms || (termsError ? "Debes aceptar los términos y la política de privacidad." : undefined);

  function chooseMethod(nextMethod: SignupMethod) {
    setMethod(nextMethod);
    setTermsAccepted(false);
    setMarketingOptIn(false);
  }

  if (!method) {
    return (
      <div className="grid gap-5">
        {oauthError ? <p role="alert" className="rounded-xl border border-red-300/20 bg-red-300/5 px-4 py-3 text-sm leading-6 text-red-200">{oauthError === "cancelled" ? "El registro con el proveedor fue cancelado. Elige Google o Discord para intentarlo nuevamente." : "Google o Discord rechazó la solicitud de registro. Inténtalo de nuevo y autoriza el acceso a Crealy."}</p> : null}
        {consentError ? <p role="alert" className="rounded-xl border border-red-300/20 bg-red-300/5 px-4 py-3 text-sm leading-6 text-red-200">No pudimos guardar tus preferencias. Elige un método e inténtalo nuevamente.</p> : null}
        {inviteError ? <p role="alert" className="rounded-xl border border-red-300/20 bg-red-300/5 px-4 py-3 text-sm leading-6 text-red-200">El código de invitación no está disponible o ha expirado.</p> : null}
        {termsError ? <p role="alert" className="rounded-xl border border-red-300/20 bg-red-300/5 px-4 py-3 text-sm leading-6 text-red-200">Debes aceptar los términos y la política de privacidad para registrarte.</p> : null}
        <div>
          <p className="text-sm font-semibold text-foreground">¿Cómo quieres registrarte?</p>
          <p className="mt-1 text-xs leading-5 text-muted">Podrás cambiar de método antes de crear tu cuenta.</p>
        </div>
        <div className="grid gap-3">
          {googleEnabled ? <MethodOption icon={<GoogleMark />} label="Continuar con Google" detail="Rápido, sin crear otra contraseña" onClick={() => chooseMethod("google")} /> : null}
          {discordEnabled ? <MethodOption icon={<DiscordMark />} label="Continuar con Discord" detail="Usa tu cuenta y perfil de Discord" onClick={() => chooseMethod("discord")} /> : null}
          <MethodOption icon={<Mail aria-hidden="true" className="size-5 text-foreground" />} label="Registrarme con correo" detail="Crea una contraseña para Crealy" onClick={() => chooseMethod("email")} />
        </div>
        <p className="text-center text-sm text-muted">
          ¿Ya tienes una cuenta?{" "}
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-foreground transition-colors hover:text-brand">Iniciar sesión</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {oauthError ? <p role="alert" className="rounded-xl border border-red-300/20 bg-red-300/5 px-4 py-3 text-sm leading-6 text-red-200">{oauthError === "cancelled" ? "El registro con el proveedor fue cancelado. Inténtalo nuevamente." : "El proveedor rechazó la solicitud de registro. Vuelve a autorizar el acceso a Crealy."}</p> : null}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs text-muted">Método seleccionado</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{methodLabels[method]}</p>
        </div>
        <button type="button" onClick={() => setMethod(null)} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] px-3 text-sm font-semibold text-muted transition-colors hover:bg-white/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <ArrowLeft aria-hidden="true" className="size-4" />Cambiar
        </button>
      </div>

      {consentError ? <p role="alert" className="rounded-xl border border-red-300/20 bg-red-300/5 px-4 py-3 text-sm leading-6 text-red-200">No pudimos guardar tus preferencias. Inténtalo nuevamente.</p> : null}

      {inviteRequired ? (
        <div>
          <FormField id="signup-invite-code" name="inviteCodeDisplay" type="text" label="Código de invitación" autoComplete="off" minLength={12} maxLength={160} required value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} error={state.fieldErrors?.inviteCode || (inviteError ? "El código no está disponible o ha expirado." : undefined)} />
          <p className="mt-2 text-xs leading-5 text-muted">Validaremos el código al crear tu cuenta.</p>
        </div>
      ) : null}

      {method === "email" ? (
        <form action={formAction} onSubmit={() => trackConversion("signup_started")} className="grid gap-5" noValidate>
          <input type="hidden" name="next" value={nextPath} />
          {inviteRequired ? <input type="hidden" name="inviteCode" value={inviteCode} /> : null}
          <input type="hidden" name="termsAccepted" value={termsAccepted ? "on" : ""} />
          <input type="hidden" name="marketingOptIn" value={marketingOptIn ? "on" : ""} />
          <AuthMessage state={state} />
          <FormField id="signup-name" name="name" type="text" label="Nombre" autoComplete="name" minLength={2} maxLength={60} required defaultValue={state.values?.name} error={state.fieldErrors?.name} />
          <FormField id="signup-email" name="email" type="email" label="Correo electrónico" autoComplete="email" inputMode="email" required defaultValue={state.values?.email} error={state.fieldErrors?.email} />
          <PasswordInput id="signup-password" name="password" label="Contraseña" autoComplete="new-password" error={state.fieldErrors?.password} />
          <PasswordInput id="signup-confirm-password" name="confirmPassword" label="Confirmar contraseña" autoComplete="new-password" error={state.fieldErrors?.confirmPassword} />
          <ConsentFields termsAccepted={termsAccepted} marketingOptIn={marketingOptIn} setTermsAccepted={setTermsAccepted} setMarketingOptIn={setMarketingOptIn} termsError={visibleTermsError} />
          <SubmitButton pendingLabel="Creando cuenta…" disabled={!termsAccepted}>Crear cuenta</SubmitButton>
        </form>
      ) : (
        <div className="grid gap-4">
          <SocialAuthButtons nextPath={nextPath} flow="signup" provider={method} inviteCode={inviteCode} inviteRequired={inviteRequired} termsAccepted={termsAccepted} marketingOptIn={marketingOptIn} googleEnabled={googleEnabled} discordEnabled={discordEnabled} />
          {!termsAccepted ? <p className="text-center text-xs leading-5 text-muted">Acepta los términos debajo para activar el registro.</p> : null}
          <ConsentFields termsAccepted={termsAccepted} marketingOptIn={marketingOptIn} setTermsAccepted={setTermsAccepted} setMarketingOptIn={setMarketingOptIn} termsError={visibleTermsError} />
        </div>
      )}

      <p className="text-center text-sm text-muted">
        ¿Ya tienes una cuenta?{" "}
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-foreground transition-colors hover:text-brand">Iniciar sesión</Link>
      </p>
    </div>
  );
}
