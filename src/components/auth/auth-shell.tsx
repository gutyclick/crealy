import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/ui/logo";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-4 py-20 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-brand/[0.055] blur-3xl"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="rounded-[0.7rem] px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Volver al inicio
          </Link>
        </div>

        <section className="rounded-2xl border border-white/10 bg-surface p-6 sm:p-8">
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
          <div className="mt-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
