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
        callbackError={params.error === "auth_callback"}
      />
    </AuthShell>
  );
}
