"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, background: "#080808", color: "#F7F7F5", fontFamily: "Arial, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div style={{ maxWidth: 560 }}>
            <p style={{ color: "#DDF527", fontWeight: 700 }}>Crealy</p>
            <h1 style={{ fontSize: 42, lineHeight: 1.05 }}>No pudimos cargar la aplicación.</h1>
            <p style={{ color: "#B0B1AA", lineHeight: 1.7 }}>
              Inténtalo otra vez. Si el problema continúa, consulta el centro de ayuda.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 20, minHeight: 48, border: 0, borderRadius: 10, background: "#DDF527", color: "#111400", padding: "0 22px", fontWeight: 700 }}
            >
              Volver a intentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
