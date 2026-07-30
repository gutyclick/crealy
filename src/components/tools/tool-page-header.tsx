import Link from "next/link";
import { ArrowLeft, LockKeyhole, Sparkles } from "lucide-react";

import { Container } from "@/components/layout/container";

type ToolPageHeaderProps = {
  title: string;
  description: string;
  requiresAuth?: boolean;
  usesAI?: boolean;
};

export function ToolPageHeader({
  title,
  description,
  requiresAuth = false,
  usesAI = false,
}: ToolPageHeaderProps) {
  return (
    <header className="border-b border-white/[0.08] pt-28 pb-10 sm:pt-32 sm:pb-14">
      <Container>
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Todas las herramientas
        </Link>
        <div className="mt-7 flex max-w-3xl flex-wrap items-center gap-2">
          {usesAI ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-ink">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Análisis con IA
            </span>
          ) : (
            <span className="rounded-full border border-white/12 px-3 py-1 text-xs font-medium text-white/70">
              Herramienta gratuita
            </span>
          )}
          {requiresAuth && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1 text-xs font-medium text-white/70">
              <LockKeyhole className="size-3.5" aria-hidden="true" />
              Requiere cuenta
            </span>
          )}
        </div>
        <h1 className="mt-5 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted sm:text-lg">
          {description}
        </p>
      </Container>
    </header>
  );
}
