"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BillingSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function synchronize() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/billing/reconcile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "No pudimos actualizar el plan.");
      }
      setMessage("Plan actualizado correctamente.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No pudimos actualizar el plan.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={synchronize}
        disabled={loading}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-muted transition-colors hover:text-foreground disabled:opacity-50"
      >
        {loading ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <RefreshCw aria-hidden="true" className="size-4" />
        )}
        {loading ? "Actualizando" : "Ya pagué · actualizar plan"}
      </button>
      {message ? (
        <p role="status" className="mt-2 text-sm leading-6 text-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}
