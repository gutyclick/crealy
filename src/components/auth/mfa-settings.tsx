"use client";

import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type EnrollingFactor = { id: string; qrCode: string };

export function MfaSettings() {
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
    <section className="border-b border-white/10 py-8" aria-labelledby="mfa-title">
      <div className="flex items-start gap-3">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 text-brand" />
        <div>
          <h2 id="mfa-title" className="text-lg font-semibold">Autenticación multifactor</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Protege tu cuenta con códigos TOTP. No se usa SMS.</p>
        </div>
      </div>
      {busy ? <LoaderCircle aria-label="Cargando" className="mt-5 size-5 animate-spin text-brand" /> : verifiedFactorId ? (
        <button type="button" onClick={disable} className="mt-5 min-h-11 rounded-xl border border-red-300/25 px-4 text-sm font-semibold text-red-200 hover:bg-red-300/[0.05]">Desactivar TOTP</button>
      ) : enrolling ? (
        <div className="mt-5">
          {/* Supabase returns a local data URL; it is never logged or persisted. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrolling.qrCode} alt="Código QR para configurar TOTP" className="size-48 rounded-xl bg-white p-3" />
          <label className="mt-4 block text-sm font-semibold">Código de verificación
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-surface px-4 font-mono tracking-[0.25em] outline-none focus:border-brand/60" />
          </label>
          <button type="button" onClick={verify} className="mt-4 min-h-11 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink">Activar TOTP</button>
        </div>
      ) : (
        <button type="button" onClick={beginEnrollment} className="mt-5 min-h-11 rounded-xl border border-white/15 px-4 text-sm font-semibold hover:bg-white/[0.05]">Configurar TOTP</button>
      )}
      {message ? <p aria-live="polite" className="mt-4 text-sm text-muted">{message}</p> : null}
      <p className="mt-4 text-xs leading-5 text-muted">Supabase no ofrece códigos de recuperación; puedes registrar un segundo factor TOTP como respaldo.</p>
    </section>
  );
}

