import Image from "next/image";
import { Check, MoveRight, ScanSearch, Sparkles } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SeoLandingCta } from "@/components/seo/seo-landing-cta";
import { getPublicSiteUrl } from "@/lib/seo/get-public-site-url";

export type SeoProductPageConfig = {
  slug: string;
  analyticsKey: string;
  eyebrow: string;
  title: string;
  lead: string;
  proofLabel: string;
  image: string;
  imageAlt: string;
  format: string;
  intent: string;
  result: string;
  benefits: Array<{ title: string; text: string }>;
  steps: Array<{ title: string; text: string }>;
  related: Array<{ href: string; label: string }>;
  faq: Array<{ question: string; answer: string }>;
};

export function SeoProductPage({ config }: { config: SeoProductPageConfig }) {
  const siteUrl = getPublicSiteUrl();
  const pageUrl = `${siteUrl}/${config.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: config.eyebrow,
        url: pageUrl,
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        description: config.lead,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Cuenta gratuita con créditos iniciales" },
      },
      {
        "@type": "FAQPage",
        mainEntity: config.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Crealy", item: siteUrl },
          { "@type": "ListItem", position: 2, name: config.eyebrow, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <>
      <Header />
      <main className="flex-1 overflow-hidden">
        <section className="relative border-b border-white/[0.08] pb-16 pt-28 sm:pb-24 sm:pt-36">
          <div aria-hidden="true" className="absolute left-1/2 top-16 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-brand/[0.07] blur-[100px]" />
          <Container className="relative grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
            <div className="text-center lg:text-left">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-brand">{config.eyebrow}</p>
              <h1 className="mt-5 text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-7xl">{config.title}</h1>
              <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-7 text-muted sm:text-lg lg:mx-0">{config.lead}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row lg:justify-start">
                <SeoLandingCta landing={config.analyticsKey} href="/signup">Crear mi primer diseño</SeoLandingCta>
                <SeoLandingCta landing={config.analyticsKey} href="/#examples" secondary>Ver resultados</SeoLandingCta>
              </div>
              <p className="mt-5 text-xs leading-5 text-white/50">Cuenta gratis con créditos iniciales. No necesitas tarjeta.</p>
            </div>

            <div className="relative mx-auto w-full max-w-3xl">
              <div className="absolute -inset-3 rounded-[2rem] border border-brand/15 bg-brand/[0.035]" />
              <figure className="relative overflow-hidden rounded-[1.35rem] border border-white/15 bg-surface shadow-[0_32px_90px_rgba(0,0,0,0.48)]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-white/55">
                  <span>{config.proofLabel}</span><span>{config.format}</span>
                </div>
                <div className="relative aspect-video">
                  <Image src={config.image} alt={config.imageAlt} fill priority sizes="(max-width: 1024px) 92vw, 52vw" className="object-cover" />
                  <span className="absolute bottom-3 left-3 rounded-md bg-black/70 px-2 py-1 font-mono text-[0.58rem] tracking-[0.1em] text-white/80">GENERADO CON CREALY</span>
                </div>
              </figure>
            </div>
          </Container>
        </section>

        <section className="border-b border-white/[0.08] bg-surface-soft py-16 sm:py-24">
          <Container>
            <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-background lg:grid-cols-[1fr_auto_1fr]">
              <div className="p-7 sm:p-10">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Tu punto de partida</span>
                <p className="mt-4 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">{config.intent}</p>
              </div>
              <div className="grid min-h-16 place-items-center border-y border-white/10 px-8 text-brand lg:border-x lg:border-y-0"><MoveRight aria-hidden="true" className="size-6 rotate-90 lg:rotate-0" /></div>
              <div className="p-7 sm:p-10">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Lo que prepara Crealy</span>
                <p className="mt-4 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">{config.result}</p>
              </div>
            </div>
          </Container>
        </section>

        <section className="py-16 sm:py-24">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand">Decisiones que importan</p>
              <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Dirección visual sin empezar de cero.</h2>
            </div>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
              {config.benefits.map((benefit, index) => (
                <article key={benefit.title} className="bg-surface p-7 sm:p-8">
                  <div className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">{index === 0 ? <Sparkles className="size-5" /> : index === 1 ? <ScanSearch className="size-5" /> : <Check className="size-5" />}</div>
                  <h3 className="mt-8 text-xl font-semibold">{benefit.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{benefit.text}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-y border-white/[0.08] bg-surface-soft py-16 sm:py-24">
          <Container className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand">Cómo funciona</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Del brief al archivo final.</h2>
            </div>
            <ol className="grid gap-3">
              {config.steps.map((step, index) => (
                <li key={step.title} className="grid grid-cols-[2.75rem_1fr] gap-4 rounded-xl border border-white/10 bg-background p-5 sm:p-6">
                  <span className="font-mono text-sm text-brand">0{index + 1}</span>
                  <div><h3 className="font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{step.text}</p></div>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        <section className="py-16 sm:py-24">
          <Container className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand">Preguntas frecuentes</p>
              <h2 className="mt-4 max-w-md text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Lo necesario antes de crear.</h2>
            </div>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {config.faq.map((item) => <details key={item.question} className="group py-5"><summary className="cursor-pointer list-none pr-8 font-semibold marker:hidden">{item.question}</summary><p className="mt-3 max-w-xl text-sm leading-6 text-muted">{item.answer}</p></details>)}
            </div>
          </Container>
        </section>

        <section className="border-t border-white/[0.08] bg-brand py-14 text-brand-ink sm:py-20">
          <Container className="flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
            <div><p className="font-mono text-xs font-bold uppercase tracking-[0.14em]">Listo para probar</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Tu próxima pieza empieza con una idea.</h2></div>
            <SeoLandingCta landing={config.analyticsKey} href="/signup" onBrand>Crear cuenta gratis</SeoLandingCta>
          </Container>
        </section>

        <nav aria-label="Otros formatos de Crealy" className="border-t border-white/[0.08]">
          <Container className="grid gap-px bg-white/10 sm:grid-cols-3">
            {config.related.map((item) => <a key={item.href} href={item.href} className="flex min-h-20 items-center justify-between bg-background px-5 text-sm font-semibold transition-colors hover:bg-surface"><span>{item.label}</span><MoveRight className="size-4 text-brand" /></a>)}
          </Container>
        </nav>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    </>
  );
}
