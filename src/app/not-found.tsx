import Link from "next/link";

import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5 py-16 text-center">
      <div className="max-w-xl">
        <div className="flex justify-center"><Logo /></div>
        <p className="mt-12 text-sm font-semibold text-brand">Error 404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
          No encontramos esta página.
        </h1>
        <p className="mt-5 text-base leading-7 text-muted">
          Es posible que el enlace haya cambiado o que la dirección no sea correcta.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-6 text-sm font-bold text-brand-ink">
            Volver al inicio
          </Link>
          <Link href="/help" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-6 text-sm font-semibold">
            Centro de ayuda
          </Link>
        </div>
      </div>
    </main>
  );
}

