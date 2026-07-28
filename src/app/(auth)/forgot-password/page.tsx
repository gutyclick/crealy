import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recupera tu acceso."
      description="Te enviaremos un enlace seguro para establecer una contraseña nueva."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
