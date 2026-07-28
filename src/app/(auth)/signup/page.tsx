import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Crea tu cuenta."
      description="Empieza con una cuenta personal y prepara tu espacio para crear."
    >
      <SignupForm />
    </AuthShell>
  );
}
