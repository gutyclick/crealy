import type { Metadata } from "next";

import { updateEmail, updateProfile } from "@/app/(dashboard)/settings/actions";
import { Container } from "@/components/layout/container";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Perfil | Crealy" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; emailPending?: string; error?: string }>;
}) {
  const user = await requireUser("/settings/profile");
  const supabase = await createClient();
  const [{ data: profile }, params] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    searchParams,
  ]);

  return (
    <main className="py-12 sm:py-16">
      <Container>
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-medium text-brand">Tu cuenta</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
            Perfil
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Mantén actualizados los datos que Crealy usa para personalizar tu espacio.
          </p>
          <form action={updateProfile} className="mt-10 border-y border-white/10 py-8">
            <label htmlFor="fullName" className="text-sm font-semibold">
              Nombre
            </label>
            <input
              id="fullName"
              name="fullName"
              required
              minLength={2}
              maxLength={60}
              defaultValue={profile?.full_name ?? ""}
              className="mt-3 h-12 w-full rounded-xl border border-white/12 bg-surface px-4 outline-none focus:border-brand/60"
            />
            <p className="mt-5 text-sm text-muted">
              Correo actual: <span className="text-foreground">{user.email}</span>{" "}
              <span className="text-brand">
                {user.email_confirmed_at ? "· Verificado" : "· No verificado"}
              </span>
            </p>
            {params.saved ? <p role="status" className="mt-4 text-sm text-brand">Perfil actualizado.</p> : null}
            {params.error ? <p role="alert" className="mt-4 text-sm text-red-300">{params.error}</p> : null}
            <button className="mt-6 min-h-11 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink hover:bg-[var(--brand-hover)]">
              Guardar perfil
            </button>
          </form>
          <form action={updateEmail} className="border-b border-white/10 py-8">
            <h2 className="text-lg font-semibold">Cambiar correo</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              El cambio queda pendiente hasta completar la confirmación oficial de Supabase.
            </p>
            <label htmlFor="email" className="mt-5 block text-sm font-semibold">Correo nuevo</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="mt-3 h-12 w-full rounded-xl border border-white/12 bg-surface px-4 outline-none focus:border-brand/60" />
            {params.emailPending ? <p role="status" className="mt-4 text-sm text-brand">Revisa tu correo actual y el nuevo para confirmar el cambio.</p> : null}
            <button className="mt-5 min-h-11 rounded-xl border border-white/15 px-5 text-sm font-semibold hover:bg-white/[0.05]">Solicitar cambio</button>
          </form>
        </div>
      </Container>
    </main>
  );
}
