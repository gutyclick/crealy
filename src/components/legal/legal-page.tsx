import { Container } from "@/components/layout/container";
import { PublicPageShell } from "@/components/layout/public-page-shell";

export type LegalSection = {
  title: string;
  paragraphs: readonly string[];
  items?: readonly string[];
};

export function LegalPage({
  title,
  summary,
  effectiveDate,
  sections,
}: {
  title: string;
  summary: string;
  effectiveDate?: string;
  sections: readonly LegalSection[];
}) {
  const entity =
    process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME?.trim() ||
    "[ENTIDAD LEGAL PENDIENTE]";
  const contact =
    process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL?.trim() ||
    "[CONTACTO LEGAL PENDIENTE]";
  const country =
    process.env.NEXT_PUBLIC_LEGAL_COUNTRY?.trim() ||
    "[PAÍS Y LEY APLICABLE PENDIENTES]";

  return (
    <PublicPageShell>
      <article>
        <header className="border-b border-white/8 py-16 sm:py-24">
          <Container className="max-w-4xl">
            <p className="text-sm font-semibold text-brand">
              Documento provisional · Revisión legal requerida
            </p>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-muted">
              {summary}
            </p>
            <dl className="mt-8 grid gap-3 text-sm text-muted sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-foreground">Responsable</dt>
                <dd className="mt-1">{entity}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Vigencia</dt>
                <dd className="mt-1">{effectiveDate || "[FECHA PENDIENTE]"}</dd>
              </div>
            </dl>
          </Container>
        </header>
        <Container className="max-w-4xl py-12 sm:py-16">
          <aside className="rounded-xl border border-amber-200/20 bg-amber-200/[0.055] p-5 text-sm leading-6 text-amber-50">
            Este texto describe la implementación actual de Crealy, pero no
            sustituye asesoría jurídica. La entidad, jurisdicción, fechas y
            decisiones comerciales pendientes deben validarse antes de abrir el
            servicio al público.
          </aside>
          <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {sections.map((section) => (
              <section key={section.title} className="py-8">
                <h2 className="text-xl font-semibold tracking-[-0.02em]">
                  {section.title}
                </h2>
                <div className="mt-4 grid gap-4 text-sm leading-7 text-muted">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.items && (
                    <ul className="grid list-disc gap-2 pl-5">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>
          <p className="mt-8 text-sm leading-6 text-muted">
            Contacto para estas materias: {contact}. Jurisdicción pendiente de
            validación: {country}.
          </p>
        </Container>
      </article>
    </PublicPageShell>
  );
}

