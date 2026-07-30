import { ContactForm } from "@/components/support/contact-form";
import { Container } from "@/components/layout/container";
import { PublicPageShell } from "@/components/layout/public-page-shell";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createMetadata } from "@/lib/seo/create-metadata";

export const metadata = createMetadata({
  title: "Contacto y soporte",
  description: "Envía una solicitud de soporte a Crealy de forma segura.",
  path: "/contact",
});

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subject?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  return (
    <PublicPageShell>
      <section className="border-b border-white/8 py-16 sm:py-24">
        <Container className="max-w-4xl text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
            Cuéntanos qué necesitas.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted">
            Describe el problema con claridad. No incluyas contraseñas, claves,
            prompts privados ni información de pago.
          </p>
        </Container>
      </section>
      <Container className="max-w-3xl py-12 sm:py-16">
        <ContactForm
          defaultCategory={params.category}
          defaultSubject={params.subject}
          authenticated={Boolean(user)}
        />
      </Container>
    </PublicPageShell>
  );
}
