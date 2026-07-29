import type { Metadata } from "next";

import { updatePassword } from "@/app/(dashboard)/settings/actions";
import { Container } from "@/components/layout/container";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Seguridad | Crealy" };

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser("/settings/security");
  const params = await searchParams;
  return (
    <main className="py-12 sm:py-16">
      <Container>
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-medium text-brand">Acceso</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Seguridad</h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Tu sesión está vinculada a <span className="text-foreground">{user.email}</span>.
          </p>
          <form action={updatePassword} className="mt-10 border-y border-white/10 py-8">
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
            {params.saved ? <p role="status" className="mt-4 text-sm text-brand">Contraseña actualizada.</p> : null}
            {params.error ? <p role="alert" className="mt-4 text-sm text-red-300">{params.error}</p> : null}
            <button className="mt-6 min-h-11 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink hover:bg-[var(--brand-hover)]">
              Actualizar contraseña
            </button>
          </form>
        </div>
      </Container>
    </main>
  );
}
