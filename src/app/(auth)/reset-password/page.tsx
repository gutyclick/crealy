import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export const metadata: Metadata = {
  title: "Nueva contraseña",
};

export default async function ResetPasswordPage() {
  const cookieStore = await cookies();
  const hasRecoverySession =
    cookieStore.get("crealy_recovery_session")?.value === "1";
  const user = await getCurrentUser();

  if (!user || !hasRecoverySession) {
    return (
      <AuthShell
        title="Este enlace ya no funciona."
        description="El enlace de recuperación expiró, ya fue utilizado o no es válido."
      >
        <Link
          href="/forgot-password"
          className="inline-flex h-12 w-full items-center justify-center rounded-[0.7rem] bg-brand px-5 text-sm font-semibold text-brand-ink transition-colors hover:bg-[var(--brand-hover)]"
        >
          Solicitar un enlace nuevo
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Elige una contraseña nueva."
      description="Utiliza al menos 8 caracteres y evita reutilizar una contraseña anterior."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
