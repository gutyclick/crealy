import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { ToolCard } from "@/components/tools/tool-card";
import { toolCategoryLabels, tools } from "@/config/tools";
import type { ToolCategory } from "@/types/tools";

export const metadata: Metadata = { title: "Herramientas | Crealy" };

const order: ToolCategory[] = ["preview", "analysis", "download", "utility"];

export default function DashboardToolsPage() {
  return (
    <main className="py-12 sm:py-16">
      <Container>
        <header className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Revisa cada pieza antes de publicarla.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-7 text-muted">
            Previsualiza, compara y verifica tus diseños sin salir de tu espacio de trabajo.
          </p>
        </header>

        <div className="mt-14 grid gap-14 sm:mt-16">
          {order.map((category) => {
            const items = tools.filter(
              (tool) => tool.category === category && tool.isEnabled,
            );
            if (items.length === 0) return null;

            return (
              <section
                key={category}
                aria-labelledby={`dashboard-tools-${category}`}
                className="grid min-w-0 gap-6 lg:grid-cols-[220px_1fr]"
              >
                <div>
                  <h2
                    id={`dashboard-tools-${category}`}
                    className="text-2xl font-semibold tracking-[-0.025em]"
                  >
                    {toolCategoryLabels[category].title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {toolCategoryLabels[category].description}
                  </p>
                </div>
                <div className="grid min-w-0 gap-4 md:grid-cols-2">
                  {items.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      href={`/dashboard/tools/${tool.id}`}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Container>
    </main>
  );
}
