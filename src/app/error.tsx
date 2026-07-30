"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Crealy UI]", { digest: error.digest || "unavailable" });
  }, [error]);

  return (
    <main className="grid min-h-[70dvh] place-items-center px-5 py-16 text-center">
      <div className="max-w-xl">
        <p className="text-sm font-semibold text-brand">Crealy</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Algo no salió como esperábamos.
        </h1>
        <p className="mt-5 text-base leading-7 text-muted">
          Tus datos guardados siguen en su sitio. Puedes intentar cargar esta vista de nuevo.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-white/45">Referencia: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="min-h-12 rounded-xl bg-brand px-6 text-sm font-bold text-brand-ink">
            Intentar de nuevo
          </button>
          <Link href="/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-6 text-sm font-semibold">
            Ir al dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

