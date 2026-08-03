import type { Metadata } from "next";

import { closeOtherSessions, updatePassword } from "@/app/(dashboard)/settings/actions";
import { MfaSettings } from "@/components/auth/mfa-settings";
import { Container } from "@/components/layout/container";
import { requireUser } from "@/lib/auth/require-user";
import { getMfaAssurance } from "@/lib/auth/mfa-assurance";
import { getSafeRedirect } from "@/lib/auth/redirects";

export const metadata: Metadata = { title: "Seguridad | Crealy" };

export default async function SecurityPage({
  searchParams,
}: {
    searchParams: Promise<{ saved?: string; sessionsClosed?: string; error?: string; mfaSetup?: string; next?: string }>;
}) {
  const user = await requireUser("/settings/security");
  const params = await searchParams;
  const assurance = await getMfaAssurance();
  const canManageSensitiveSecurity = assurance.currentLevel === "aal2";
  const nextPath = params.next ? getSafeRedirect(params.next, "/settings/security") : undefined;
  return (
    <main className="py-12 sm:py-16">
      <Container>
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-medium text-brand">Acceso</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Seguridad</h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Tu sesión está vinculada a <span className="text-foreground">{user.email}</span>.
          </p>
          {params.mfaSetup ? <div role="status" className="mt-8 rounded-xl bg-brand/[0.07] p-4 text-sm leading-6 text-white/80">Configura el segundo factor para proteger y continuar hacia la operación solicitada.</div> : null}
          {canManageSensitiveSecurity ? <form action={updatePassword} className="mt-10 border-y border-white/10 py-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Nueva contraseña
                <input name="password" type="password" minLength={8} required autoComplete="new-password" className="mt-3 h-12 w-full rounded-xl border border-white/12 bg-surface px-4 outline-none focus:border-brand/60" />
              </label>
              <label className="text-sm font-semibold">
                Confirmar contraseña
                <input name="confirmation" type="password" minLength={8} required autoComplete="new-password" className="mt-3 h-12 w-full rounded-xl border border-white/12 bg-surface px-4 outline-none focus:border-brand/60" />
              </label>
            </div>
            <label className="mt-5 flex min-h-10 items-center gap-3 text-sm text-muted">
              <input name="closeOtherSessions" type="checkbox" className="size-4 accent-[#DDF527]" />
              Cerrar otras sesiones después del cambio
            </label>
            {params.saved ? <p role="status" className="mt-4 text-sm text-brand">Contraseña actualizada.</p> : null}
            {params.error ? <p role="alert" className="mt-4 text-sm text-red-300">{params.error}</p> : null}
            <button className="mt-6 min-h-11 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink hover:bg-[var(--brand-hover)]">
              Actualizar contraseña
            </button>
          </form> : <div className="mt-10 border-y border-white/10 py-7"><h2 className="text-lg font-semibold">Cambios sensibles protegidos</h2><p className="mt-2 text-sm leading-6 text-muted">Activa TOTP y completa la verificación para cambiar la contraseña o cerrar sesiones.</p></div>}
          <MfaSettings assuranceLevel={assurance.currentLevel} nextPath={nextPath} />
          {canManageSensitiveSecurity ? <form action={closeOtherSessions} className="border-b border-white/10 py-8">
            <h2 className="text-lg font-semibold">Sesiones</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Cierra todas las demás sesiones y conserva la actual. Los tokens ya emitidos pueden seguir activos hasta su expiración.
            </p>
            {params.sessionsClosed ? <p role="status" className="mt-4 text-sm text-brand">Las otras sesiones se cerraron.</p> : null}
            <button className="mt-5 min-h-11 rounded-xl border border-white/15 px-4 text-sm font-semibold hover:bg-white/[0.05]">Cerrar otras sesiones</button>
          </form> : null}
        </div>
      </Container>
    </main>
  );
}
