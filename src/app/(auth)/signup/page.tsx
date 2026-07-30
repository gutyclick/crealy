import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { getLaunchConfig } from "@/lib/launch/server";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function SignupPage() {
  const launch = getLaunchConfig();
  return (
    <AuthShell
      title="Crea tu cuenta."
      description="Empieza con una cuenta personal y prepara tu espacio para crear."
    >
      {launch.registrationsEnabled ? (
        <SignupForm inviteRequired={launch.inviteRequired} />
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/[0.035] p-5 text-sm leading-6 text-muted">
          El registro está temporalmente cerrado mientras preparamos el siguiente
          grupo de acceso. Las cuentas existentes pueden seguir iniciando sesión.
        </p>
      )}
    </AuthShell>
  );
}
