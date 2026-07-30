import type { Metadata } from "next";

import { updateNotificationPreferences } from "@/app/(dashboard)/settings/notifications/actions";
import { Container } from "@/components/layout/container";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Notificaciones" };

const optionalSettings = [
  {
    name: "generationReady",
    key: "generation_ready",
    title: "Creación completada",
    description: "Avísame cuando una generación termine y no esté usando la aplicación.",
  },
  {
    name: "editReady",
    key: "edit_ready",
    title: "Edición completada",
    description: "Avísame cuando un cambio de imagen termine.",
  },
  {
    name: "assetExpiring",
    key: "asset_expiring",
    title: "Archivos próximos a expirar",
    description: "Recibe un aviso antes de que un archivo importante llegue a su fecha de eliminación.",
  },
  {
    name: "lowCredits",
    key: "low_credits",
    title: "Créditos bajos",
    description: "Recibe una alerta cuando el saldo disponible sea reducido.",
  },
  {
    name: "productUpdates",
    key: "product_updates",
    title: "Noticias del producto",
    description: "Cambios importantes en Crealy. No se activa automáticamente.",
  },
  {
    name: "marketingEmails",
    key: "marketing_emails",
    title: "Correos de marketing",
    description: "Novedades y contenido promocional. Desactivado por defecto.",
  },
] as const;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_preferences")
    .select(
      "generation_ready, edit_ready, asset_expiring, low_credits, billing_updates, product_updates, marketing_emails, deliverability_blocked_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="py-10 sm:py-14">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground">
          Notificaciones
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Elige qué avisos opcionales quieres recibir. Los mensajes necesarios de
          seguridad y facturación siguen activos.
        </p>

        {params.saved && (
          <p role="status" className="mt-6 rounded-xl bg-brand/[0.08] px-4 py-3 text-sm text-brand">
            Preferencias guardadas.
          </p>
        )}
        {params.error && (
          <p role="alert" className="mt-6 rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-300">
            No pudimos guardar los cambios. Inténtalo otra vez.
          </p>
        )}
        {data?.deliverability_blocked_at && (
          <p role="alert" className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-sm leading-6 text-amber-100">
            El proveedor reportó un problema de entrega. Contacta con soporte para
            revisar tu dirección antes de reactivar avisos opcionales.
          </p>
        )}

        <form action={updateNotificationPreferences} className="mt-8">
          <div className="divide-y divide-white/10 border-y border-white/10">
            {optionalSettings.map((setting) => (
              <label
                key={setting.name}
                className="flex min-h-20 cursor-pointer items-start justify-between gap-5 py-5"
              >
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {setting.title}
                  </span>
                  <span className="mt-1 block max-w-xl text-sm leading-6 text-muted">
                    {setting.description}
                  </span>
                </span>
                <input
                  type="checkbox"
                  name={setting.name}
                  defaultChecked={
                    data
                      ? Boolean(data[setting.key])
                      : setting.key === "asset_expiring" || setting.key === "low_credits"
                  }
                  disabled={Boolean(data?.deliverability_blocked_at)}
                  className="mt-1 size-5 shrink-0 accent-[var(--brand)]"
                />
              </label>
            ))}
            <div className="flex min-h-20 items-start justify-between gap-5 py-5">
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  Facturación y pagos
                </span>
                <span className="mt-1 block text-sm leading-6 text-muted">
                  Avisos necesarios para operar tu suscripción y atender pagos fallidos.
                </span>
              </span>
              <input
                type="checkbox"
                checked
                disabled
                readOnly
                aria-label="Facturación y pagos siempre activos"
                className="mt-1 size-5 shrink-0 accent-[var(--brand)]"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-7 min-h-12 rounded-xl bg-brand px-6 text-sm font-bold text-brand-ink hover:bg-[var(--brand-hover)]"
          >
            Guardar preferencias
          </button>
        </form>
      </Container>
    </main>
  );
}

