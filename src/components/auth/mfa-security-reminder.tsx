import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import {
  disableMfaReminder,
  dismissMfaReminder,
} from "@/app/(dashboard)/security-reminder-actions";
import { Container } from "@/components/layout/container";

export function MfaSecurityReminder() {
  return (
    <aside className="border-b border-white/[0.08] bg-surface-soft" aria-labelledby="mfa-reminder-title">
      <Container className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[0.7rem] bg-brand/[0.1] text-brand">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <p id="mfa-reminder-title" className="font-semibold text-foreground">
              Añade una capa extra de seguridad
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Protege tu cuenta con una app de autenticación. Es recomendado, pero no obligatorio.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Link
            href="/settings/security#mfa"
            className="inline-flex min-h-11 items-center gap-2 rounded-[0.7rem] bg-brand px-4 text-sm font-bold text-brand-ink transition-colors hover:bg-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70"
          >
            Mejorar seguridad
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <form action={dismissMfaReminder}>
            <button className="min-h-11 rounded-[0.7rem] px-4 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70">
              Ahora no
            </button>
          </form>
          <form action={disableMfaReminder}>
            <button className="min-h-11 rounded-[0.7rem] px-3 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70">
              No volver a mostrar
            </button>
          </form>
        </div>
      </Container>
    </aside>
  );
}
