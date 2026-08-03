"use client";

import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function MfaChallengeForm({ factorId, nextPath }: { factorId: string; nextPath: string }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setMessage("Introduce los seis dígitos de tu aplicación de autenticación.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId, code });
    if (error) {
      setMessage("El código no es válido o expiró. Abre tu aplicación e inténtalo nuevamente.");
      setBusy(false);
      return;
    }
    window.location.assign(nextPath);
  }

  return (
    <form onSubmit={verify} className="grid gap-5">
      <div className="flex items-start gap-3 rounded-xl bg-brand/[0.07] p-4 text-sm leading-6 text-white/80">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
        Esta comprobación protege cambios de seguridad, facturación y datos de tu cuenta.
      </div>
      <label htmlFor="mfa-code" className="text-sm font-semibold text-foreground">
        Código de autenticación
        <input
          id="mfa-code"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          required
          autoFocus
          aria-describedby={message ? "mfa-challenge-error" : "mfa-challenge-hint"}
          className="mt-3 h-12 w-full rounded-xl border border-white/12 bg-surface px-4 text-center font-mono text-xl tracking-[0.3em] outline-none focus:border-brand/60"
        />
      </label>
      <p id="mfa-challenge-hint" className="text-sm leading-6 text-muted">
        Usa el código actual de seis dígitos. Nunca te pediremos que lo compartas por correo o soporte.
      </p>
      {message ? <p id="mfa-challenge-error" role="alert" className="text-sm leading-6 text-red-300">{message}</p> : null}
      <button disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink disabled:cursor-not-allowed disabled:opacity-55">
        {busy ? <><LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> Verificando</> : "Verificar y continuar"}
      </button>
    </form>
  );
}
