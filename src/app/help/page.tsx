import Link from "next/link";

import { Container } from "@/components/layout/container";
import { PublicPageShell } from "@/components/layout/public-page-shell";
import { createMetadata } from "@/lib/seo/create-metadata";

export const metadata = createMetadata({
  title: "Centro de ayuda",
  description: "Guías breves para crear, editar y administrar tu cuenta de Crealy.",
  path: "/help",
});

const topics = [
  ["Primeros pasos", "Confirma tu correo, completa el onboarding y elige una primera acción sin consumir créditos."],
  ["Generación", "Elige el tipo de contenido, formato, estilo y colores. Cada solicitud muestra su coste antes de comenzar."],
  ["Edición", "Parte de una creación o imagen propia y pide cambios concretos. Puedes volver a versiones anteriores."],
  ["Créditos", "Las generaciones y ediciones consumen créditos según la calidad. El saldo se reserva y se libera si el trabajo falla."],
  ["Facturación", "Stripe gestiona checkout, renovación, cancelación y el portal de facturación."],
  ["Archivos", "Los originales son privados, tienen cuota y pueden expirar según el plan. Descarga lo que quieras conservar."],
  ["Herramientas", "Los previews y verificadores procesan imágenes localmente cuando es posible. Las herramientas con IA indican su uso."],
  ["Seguridad", "No compartas contraseñas ni claves. Usa la configuración de seguridad para cambiar contraseña o activar MFA."],
] as const;

export default function HelpPage() {
  return (
    <PublicPageShell>
      <section className="border-b border-white/8 py-16 sm:py-24">
        <Container className="max-w-4xl text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
            Respuestas para seguir creando.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted">
            Información directa sobre el producto, tus archivos y tu cuenta.
          </p>
        </Container>
      </section>
      <Container className="max-w-4xl py-12 sm:py-16">
        <div className="divide-y divide-white/10 border-y border-white/10">
          {topics.map(([title, description]) => (
            <section key={title} className="grid gap-3 py-6 sm:grid-cols-[12rem_1fr]">
              <h2 className="font-semibold text-foreground">{title}</h2>
              <p className="text-sm leading-6 text-muted">{description}</p>
            </section>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">¿No encontraste la respuesta?</h2>
            <p className="mt-2 text-sm text-muted">Envía una solicitud con los detalles necesarios.</p>
          </div>
          <Link
            href="/contact"
            className="inline-flex min-h-12 items-center rounded-xl bg-brand px-6 text-sm font-bold text-brand-ink"
          >
            Contactar soporte
          </Link>
        </div>
      </Container>
    </PublicPageShell>
  );
}
