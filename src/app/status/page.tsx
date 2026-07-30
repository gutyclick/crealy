import { Container } from "@/components/layout/container";
import { PublicPageShell } from "@/components/layout/public-page-shell";
import { isEditingAvailable, isGenerationAvailable } from "@/lib/env/server";
import { getLaunchConfig } from "@/lib/launch/server";
import { createMetadata } from "@/lib/seo/create-metadata";

export const metadata = createMetadata({
  title: "Estado del servicio",
  description: "Estado general de las funciones principales de Crealy.",
  path: "/status",
});

export default function StatusPage() {
  const launch = getLaunchConfig();
  const services = [
    ["Aplicación", "operational"],
    ["Generación", isGenerationAvailable() ? "operational" : "limited"],
    ["Edición", isEditingAvailable() ? "operational" : "limited"],
    ["Pagos", launch.billingEnabled ? "operational" : "disabled"],
    ["Almacenamiento", "operational"],
  ] as const;
  const labels = {
    operational: "Operativo",
    limited: "Disponibilidad limitada",
    disabled: "No habilitado",
  };

  return (
    <PublicPageShell>
      <section className="py-16 sm:py-24">
        <Container className="max-w-3xl">
          <p className="text-sm font-semibold text-brand">Estado general</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
            Servicios de Crealy
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
            Esta página muestra disponibilidad configurada, no métricas internas ni
            una garantía de disponibilidad perfecta.
          </p>
          <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {services.map(([name, state]) => (
              <div
                key={name}
                className="flex min-h-16 items-center justify-between gap-5 py-4"
              >
                <span className="font-semibold text-foreground">{name}</span>
                <span className="flex items-center gap-2 text-sm text-muted">
                  <span
                    aria-hidden="true"
                    className={`size-2.5 rounded-full ${
                      state === "operational"
                        ? "bg-brand"
                        : state === "limited"
                          ? "bg-amber-300"
                          : "bg-white/35"
                    }`}
                  />
                  {labels[state]}
                </span>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </PublicPageShell>
  );
}
