import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Cuenta" };

export default async function AccountSettingsPage() {
  await requireUser("/settings/account");
  return (
    <main className="py-10 sm:py-14">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground">
          Cuenta y datos
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Gestiona solicitudes que necesitan una revisión segura antes de aplicarse.
        </p>

        <section className="mt-10 border-y border-white/10 py-7">
          <h2 className="text-lg font-semibold text-foreground">
            Solicitar una copia de mis datos
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Prepararemos una exportación manual de los datos asociados a tu cuenta.
            Nunca incluirá credenciales, claves internas ni información de otras personas.
          </p>
          <Link
            href="/contact?category=account_security&subject=Solicitud%20de%20exportación%20de%20datos"
            className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-foreground hover:bg-white/[0.04]"
          >
            Solicitar mis datos
          </Link>
        </section>

        <section className="py-7">
          <h2 className="text-lg font-semibold text-foreground">
            Solicitar eliminación de la cuenta
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            La eliminación inmediata todavía no está automatizada. Soporte verificará
            tu identidad, suscripciones, archivos y registros financieros que deban
            conservarse por obligación. No se borrará nada al enviar el formulario.
          </p>
          <Link
            href="/contact?category=account_security&subject=Solicitud%20de%20eliminación%20de%20cuenta"
            className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-red-300/25 px-5 text-sm font-semibold text-red-200 hover:bg-red-300/[0.06]"
          >
            Iniciar solicitud de eliminación
          </Link>
        </section>
      </Container>
    </main>
  );
}
