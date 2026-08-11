"use client";

import { CheckCircle2, KeyRound, LoaderCircle, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type EnrollingFactor = { id: string; qrCode: string };

export function MfaSettings({ assuranceLevel, nextPath }: { assuranceLevel: "aal1" | "aal2" | null; nextPath?: string }) {
  const router = useRouter();
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<EnrollingFactor | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data, error } = await createClient().auth.mfa.listFactors();
      if (error) setMessage("No pudimos consultar la autenticación multifactor.");
      setVerifiedFactorId(data?.totp.find((factor) => factor.status === "verified")?.id ?? null);
      setBusy(false);
    })();
  }, []);

  async function beginEnrollment() {
    setBusy(true);
    setMessage(null);
    const { data, error } = await createClient().auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Crealy",
    });
    if (error) setMessage("No pudimos iniciar la configuración de TOTP.");
    else setEnrolling({ id: data.id, qrCode: data.totp.qr_code });
    setBusy(false);
  }

  async function verify() {
    if (!enrolling || !/^\d{6}$/.test(code)) {
      setMessage("Introduce el código de 6 dígitos de tu aplicación.");
      return;
    }
    setBusy(true);
    const { error } = await createClient().auth.mfa.challengeAndVerify({
      factorId: enrolling.id,
      code,
    });
    if (error) setMessage("El código no pudo verificarse. Inténtalo nuevamente.");
    else {
      setVerifiedFactorId(enrolling.id);
      setEnrolling(null);
      setCode("");
      setMessage("Autenticación TOTP activada.");
      if (nextPath) window.location.assign(nextPath);
      else router.refresh();
    }
    setBusy(false);
  }

  async function disable() {
    if (!verifiedFactorId) return;
    setBusy(true);
    const { error } = await createClient().auth.mfa.unenroll({ factorId: verifiedFactorId });
    if (error) setMessage("Verifica primero tu segundo factor para poder eliminarlo.");
    else {
      setVerifiedFactorId(null);
      setMessage("Autenticación TOTP desactivada.");
    }
    setBusy(false);
  }

  return (
    <section id="mfa" className="scroll-mt-28 border-b border-white/10 py-9" aria-labelledby="mfa-title">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[0.7rem] bg-brand/[0.1] text-brand">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 id="mfa-title" className="text-xl font-semibold">Verificación en dos pasos</h2>
            <p className="mt-1 max-w-lg text-sm leading-6 text-muted">Añade un código temporal de tu app de autenticación al iniciar sesión. Es opcional y puedes desactivarlo después.</p>
          </div>
        </div>
        {!busy ? <span className={`inline-flex min-h-8 w-fit items-center gap-2 rounded-full border px-3 text-xs font-semibold ${verifiedFactorId ? "border-brand/25 bg-brand/[0.07] text-brand" : "border-white/10 text-muted"}`}>
          {verifiedFactorId ? <CheckCircle2 aria-hidden="true" className="size-3.5" /> : null}
          {verifiedFactorId ? "Protección activa" : "Sin configurar"}
        </span> : null}
      </div>
      {busy ? <LoaderCircle aria-label="Cargando" className="mt-5 size-5 animate-spin text-brand" /> : verifiedFactorId && assuranceLevel !== "aal2" ? (
        <div className="mt-6 rounded-[0.8rem] border border-white/10 bg-surface p-5">
          <p className="text-sm leading-6 text-muted">Tu cuenta ya está protegida. Puedes verificar el segundo factor para confirmar que tu app sigue funcionando.</p>
          <Link href="/mfa-challenge?next=%2Fsettings%2Fsecurity" className="mt-4 inline-flex min-h-11 items-center rounded-[0.7rem] bg-brand px-4 text-sm font-bold text-brand-ink hover:bg-[var(--brand-hover)]">Comprobar código</Link>
        </div>
      ) : verifiedFactorId ? (
        <div className="mt-6">
          <p className="flex items-center gap-2 text-sm text-muted"><KeyRound aria-hidden="true" className="size-4 text-brand" />Tu app de autenticación está vinculada correctamente.</p>
          <button type="button" disabled={busy} onClick={disable} className="mt-5 min-h-11 rounded-[0.7rem] border border-red-300/25 px-4 text-sm font-semibold text-red-200 hover:bg-red-300/[0.05] disabled:opacity-55">Desactivar verificación</button>
        </div>
      ) : enrolling ? (
        <div className="mt-6 grid gap-6 rounded-[0.8rem] border border-white/10 bg-surface p-5 sm:grid-cols-[auto_1fr] sm:p-6">
          {/* Supabase returns a local data URL; it is never logged or persisted. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrolling.qrCode} alt="Código QR para configurar TOTP" className="size-48 justify-self-center rounded-[0.8rem] bg-white p-3" />
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold"><Smartphone aria-hidden="true" className="size-4 text-brand" />Escanea y confirma</p>
            <p className="mt-2 text-sm leading-6 text-muted">Escanea el QR con Google Authenticator, 1Password, Authy u otra app compatible.</p>
            <label className="mt-4 block text-sm font-semibold">Código de seis dígitos
              <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="mt-2 h-14 w-full rounded-[0.7rem] border border-white/12 bg-background px-4 text-center font-mono text-xl tracking-[0.3em] outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/15" />
            </label>
            <button type="button" disabled={busy} onClick={verify} className="mt-4 min-h-11 rounded-[0.7rem] bg-brand px-5 text-sm font-bold text-brand-ink hover:bg-[var(--brand-hover)] disabled:opacity-55">Activar verificación</button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4 border-y border-white/[0.08] py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-sm leading-6 text-muted">Solo necesitas una app de autenticación. No utilizamos SMS ni compartimos tu número.</p>
          <button type="button" disabled={busy} onClick={beginEnrollment} className="min-h-11 shrink-0 rounded-[0.7rem] bg-brand px-5 text-sm font-bold text-brand-ink hover:bg-[var(--brand-hover)] disabled:opacity-55">Configurar ahora</button>
        </div>
      )}
      {message ? <p aria-live="polite" className="mt-4 text-sm text-muted">{message}</p> : null}
      <p className="mt-4 text-xs leading-5 text-muted">Guarda acceso a tu app de autenticación. Puedes registrar otro factor TOTP como respaldo.</p>
    </section>
  );
}
