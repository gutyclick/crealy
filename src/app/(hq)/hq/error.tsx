"use client";

import { RotateCcw } from "lucide-react";

export default function HqError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="hq-error-state" role="alert">
    <h1>No pudimos leer la operación.</h1>
    <p>Los datos no se reemplazaron por ceros. Reintenta la conexión antes de tomar una decisión.</p>
    <button type="button" onClick={reset}><RotateCcw aria-hidden="true" className="size-4" /> Reintentar</button>
  </section>;
}
