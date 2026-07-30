import { Container } from "@/components/layout/container";
import { ToolCard } from "@/components/tools/tool-card";
import { toolCategoryLabels, tools } from "@/config/tools";
import { createToolMetadata } from "@/lib/tools/create-tool-metadata";
import type { ToolCategory } from "@/types/tools";

export const metadata = createToolMetadata({
  title: "Herramientas visuales gratuitas",
  description:
    "Previsualiza, analiza, verifica y descarga recursos visuales para YouTube y redes sociales.",
  path: "/tools",
});

const order: ToolCategory[] = ["preview", "analysis", "download", "utility"];

export default function ToolsPage() {
  return (
    <>
      <section className="overflow-hidden border-b border-white/[0.08] pt-32 pb-16 sm:pt-40 sm:pb-20">
        <Container className="relative text-center">
          <div
            className="pointer-events-none absolute top-[-8rem] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand/[0.09] blur-3xl"
            aria-hidden
          />
          <span className="relative inline-flex rounded-full border border-brand/25 px-3 py-1 text-xs font-semibold text-brand">
            Centro de herramientas
          </span>
          <h1 className="relative mx-auto mt-6 max-w-full break-words text-balance text-4xl font-semibold tracking-[-0.035em] sm:max-w-4xl sm:text-6xl sm:tracking-[-0.04em] lg:text-7xl">
            Revisa el diseño antes de publicarlo.
          </h1>
          <p className="relative mx-auto mt-6 max-w-full break-words text-pretty text-base leading-7 text-muted sm:max-w-2xl sm:text-lg">
            Utilidades sencillas para comprobar medidas, zonas seguras y
            legibilidad. Las herramientas locales no suben tus imágenes.
          </p>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <div className="grid gap-16">
          {order.map((category) => {
            const items = tools.filter(
              (tool) => tool.category === category && tool.isEnabled,
            );
            return (
              <section
                key={category}
                aria-labelledby={`tools-${category}`}
                className="grid min-w-0 gap-7 lg:grid-cols-[260px_1fr]"
              >
                <div>
                  <h2
                    id={`tools-${category}`}
                    className="text-3xl font-semibold tracking-[-0.03em]"
                  >
                    {toolCategoryLabels[category].title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {toolCategoryLabels[category].description}
                  </p>
                </div>
                <div className="grid min-w-0 gap-4 md:grid-cols-2">
                  {items.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Container>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Herramientas visuales de Crealy",
            url: "https://www.crealy.app/tools",
            hasPart: tools.map((tool) => ({
              "@type": "WebApplication",
              name: tool.name,
              url: `https://www.crealy.app${tool.href}`,
            })),
          }).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
