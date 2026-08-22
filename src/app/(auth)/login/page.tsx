import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getSafeRedirect } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
    signedOut?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeRedirect(params.next, "/dashboard");

  return (
    <AuthShell
      title="Bienvenido de nuevo."
      description="Inicia sesión para entrar a tu espacio privado de Crealy."
    >
      <LoginForm
        nextPath={nextPath}
        signedOut={params.signedOut === "1"}
        authError={
          params.error === "rate_limited"
            ? "rate_limited"
            : params.error === "oauth_cancelled"
              ? "oauth_cancelled"
              : params.error === "oauth_provider"
                ? "oauth_provider"
            : params.error === "oauth"
              ? "oauth"
              : params.error === "social_signup_restricted"
                ? "restricted"
              : params.error === "auth_callback"
                ? "callback"
                : undefined
        }
        googleEnabled={process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"}
        discordEnabled={process.env.NEXT_PUBLIC_DISCORD_AUTH_ENABLED === "true"}
      />
    </AuthShell>
  );
}
