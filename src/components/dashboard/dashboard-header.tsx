import { ChevronDown, LogOut } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/ui/logo";

type DashboardHeaderProps = {
  displayName: string;
  email: string;
};

export function DashboardHeader({
  displayName,
  email,
}: DashboardHeaderProps) {
  const initial = displayName.charAt(0).toUpperCase() || "C";

  return (
    <header className="border-b border-white/[0.08] bg-background">
      <Container className="flex h-16 items-center justify-between sm:h-[4.5rem]">
        <Logo />

        <details className="group relative">
          <summary
            aria-label="Abrir menú de usuario"
            className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-[0.7rem] px-2 py-1.5 transition-colors hover:bg-white/[0.05]"
          >
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-[0.65rem] bg-surface-elevated text-sm font-semibold text-brand"
            >
              {initial}
            </span>
            <span className="hidden max-w-44 text-left sm:block">
              <span className="block truncate text-sm font-semibold text-foreground">
                {displayName}
              </span>
              <span className="block truncate text-xs text-muted">
                {email}
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className="size-4 text-muted transition-transform group-open:rotate-180"
            />
          </summary>

          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-64 rounded-[0.8rem] border border-white/10 bg-surface-elevated p-2 shadow-[0_18px_50px_rgba(0,0,0,0.38)]">
            <div className="border-b border-white/[0.08] px-3 py-2 sm:hidden">
              <p className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted">{email}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-[0.7rem] px-3 text-left text-sm font-medium text-white/72 transition-colors hover:bg-white/[0.05] hover:text-foreground"
              >
                <LogOut aria-hidden="true" className="size-4" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </details>
      </Container>
    </header>
  );
}
