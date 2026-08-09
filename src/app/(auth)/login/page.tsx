import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getLaunchConfig } from "@/lib/launch/server";
import { getSafeRedirect } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeRedirect(params.next, "/dashboard");
  const launch = getLaunchConfig();
  const socialAuthAvailable = launch.registrationsEnabled && !launch.inviteRequired;

  return (
    <AuthShell
      title="Bienvenido de nuevo."
      description="Inicia sesión para entrar a tu espacio privado de Crealy."
    >
      <LoginForm
        nextPath={nextPath}
        authError={
          params.error === "rate_limited"
            ? "rate_limited"
            : params.error === "oauth"
              ? "oauth"
              : params.error === "auth_callback"
                ? "callback"
                : undefined
        }
        googleEnabled={socialAuthAvailable && process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"}
        discordEnabled={socialAuthAvailable && process.env.NEXT_PUBLIC_DISCORD_AUTH_ENABLED === "true"}
      />
    </AuthShell>
  );
}
