import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { getLaunchConfig } from "@/lib/launch/server";
import { getSafeRedirect } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const nextPath = getSafeRedirect(params.next, "/dashboard");
  const launch = getLaunchConfig();
  return (
    <AuthShell
      title="Crea tu cuenta."
      description="Elige cómo quieres registrarte. Solo te mostraremos lo necesario para continuar."
    >
      {launch.registrationsEnabled ? (
        <SignupForm
          inviteRequired={launch.inviteRequired}
          nextPath={nextPath}
          googleEnabled={process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"}
          discordEnabled={process.env.NEXT_PUBLIC_DISCORD_AUTH_ENABLED === "true"}
          inviteError={params.error === "invite"}
          termsError={params.error === "terms"}
          consentError={params.error === "consent"}
          oauthError={
            params.error === "oauth_cancelled"
              ? "cancelled"
              : params.error === "oauth_provider"
                ? "provider"
                : undefined
          }
        />
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/[0.035] p-5 text-sm leading-6 text-muted">
          El registro está temporalmente cerrado mientras preparamos el siguiente
          grupo de acceso. Las cuentas existentes pueden seguir iniciando sesión.
        </p>
      )}
    </AuthShell>
  );
}
