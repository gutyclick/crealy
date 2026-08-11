import { Container } from "@/components/layout/container";
import { PublicPageShell } from "@/components/layout/public-page-shell";
import {
  LEGAL_ADDRESS,
  LEGAL_CONTACT_EMAIL,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_ENTITY_NAME,
  LEGAL_FORMATION,
  LEGAL_GOVERNING_LAW,
} from "@/config/legal";

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
    LEGAL_ENTITY_NAME;
  const contact =
    process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL?.trim() ||
    LEGAL_CONTACT_EMAIL;
  const country =
    process.env.NEXT_PUBLIC_LEGAL_COUNTRY?.trim() ||
    LEGAL_GOVERNING_LAW;

  return (
    <PublicPageShell>
      <article>
        <header className="border-b border-white/8 py-16 sm:py-24">
          <Container className="max-w-4xl">
            <p className="text-sm font-semibold text-brand">Información legal de Crealy</p>
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
                <dd className="mt-1">{effectiveDate || LEGAL_EFFECTIVE_DATE}</dd>
              </div>
            </dl>
          </Container>
        </header>
        <Container className="max-w-4xl py-12 sm:py-16">
          <aside className="rounded-xl border border-white/10 bg-white/[0.035] p-5 text-sm leading-6 text-muted">
            Crealy es operado por {entity}, {LEGAL_FORMATION}, con domicilio de
            contacto en {LEGAL_ADDRESS}. Para consultas legales o de privacidad,
            escribe a <a className="font-semibold text-foreground underline underline-offset-4 hover:text-brand" href={`mailto:${contact}`}>{contact}</a>.
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
            Ley aplicable general: {country}. Esta elección no limita los derechos
            imperativos que correspondan al consumidor por su lugar de residencia.
          </p>
        </Container>
      </article>
    </PublicPageShell>
  );
}
