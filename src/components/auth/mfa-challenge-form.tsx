"use client";

import { LoaderCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
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
      <div className="flex items-start gap-3 rounded-[0.8rem] border border-brand/15 bg-brand/[0.06] p-4 text-sm leading-6 text-white/80">
        <span className="grid size-9 shrink-0 place-items-center rounded-[0.65rem] bg-brand/10 text-brand">
          <ShieldCheck aria-hidden="true" className="size-5" />
        </span>
        <span>Esta verificación es opcional y solo confirma que tienes acceso a tu segundo factor.</span>
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
          className="mt-3 h-14 w-full rounded-[0.7rem] border border-white/12 bg-surface px-4 text-center font-mono text-2xl tracking-[0.38em] outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
        />
      </label>
      <p id="mfa-challenge-hint" className="text-sm leading-6 text-muted">
        Usa el código actual de seis dígitos. Nunca te pediremos que lo compartas por correo o soporte.
      </p>
      {message ? <p id="mfa-challenge-error" role="alert" className="text-sm leading-6 text-red-300">{message}</p> : null}
      <button disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[0.7rem] bg-brand px-5 text-sm font-bold text-brand-ink transition-colors hover:bg-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70 disabled:cursor-not-allowed disabled:opacity-55">
        {busy ? <><LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> Verificando</> : "Verificar y continuar"}
      </button>
      <Link href={nextPath} className="inline-flex min-h-11 items-center justify-center rounded-[0.7rem] text-sm font-semibold text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70">
        Omitir por ahora
      </Link>
    </form>
  );
}
