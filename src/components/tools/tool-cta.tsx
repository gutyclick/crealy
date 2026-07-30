import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ToolCta({
  title = "¿Quieres convertir esta revisión en un diseño terminado?",
  description = "Crea, adapta y edita contenido visual desde una sola cuenta de Crealy.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="mx-auto my-16 max-w-[1160px] px-5 sm:px-8 lg:px-10">
      <div className="overflow-hidden rounded-2xl bg-brand px-6 py-10 text-center text-brand-ink sm:px-10 sm:py-14">
        <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-black/70 sm:text-base">
          {description}
        </p>
        <Button
          href="/signup"
          variant="secondary"
          className="mt-7 border-black/15 bg-black text-white hover:border-black hover:bg-black/85"
        >
          Crear cuenta gratis
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
