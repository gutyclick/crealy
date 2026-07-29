import type { Metadata } from "next";
import Link from "next/link";

import { GenerationGrid } from "@/components/generation/generation-grid";
import { Container } from "@/components/layout/container";
import { requireUser } from "@/lib/auth/require-user";
import { listGenerations } from "@/lib/generation/list-generations";

export const metadata: Metadata = {
  title: "Creaciones",
};

export default async function GenerationsPage() {
  const user = await requireUser("/generations");
  const items = await listGenerations(user.id, 24);

  return (
    <main className="py-10 sm:py-14">
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand">Tu biblioteca</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
              Creaciones
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Revisa, descarga y continúa las piezas que ya generaste.
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink hover:bg-[var(--brand-hover)]"
          >
            Crear nueva
          </Link>
        </div>
        <div className="mt-9">
          <GenerationGrid items={items} />
        </div>
      </Container>
    </main>
  );
}
