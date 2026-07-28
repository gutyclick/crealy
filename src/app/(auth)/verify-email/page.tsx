import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

export const metadata: Metadata = {
  title: "Confirma tu correo",
};

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Revisa tu correo."
      description="Te enviamos un enlace para confirmar tu cuenta antes de entrar a Crealy."
    >
      <div className="grid gap-6">
        <div className="flex gap-4 rounded-[0.8rem] border border-white/10 bg-background p-4">
          <MailCheck
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-brand"
          />
          <p className="text-sm leading-6 text-white/72">
            Abre el enlace del correo y vuelve a Crealy. Si no lo encuentras,
            revisa también la carpeta de spam.
          </p>
        </div>
        <ResendVerificationForm />
        <Link
          href="/login"
          className="text-center text-sm font-semibold text-foreground transition-colors hover:text-brand"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    </AuthShell>
  );
}
