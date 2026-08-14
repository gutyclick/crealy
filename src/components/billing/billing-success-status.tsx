"use client";

import { Check, LoaderCircle, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type BillingStatus = {
  plan: "free" | "starter" | "pro" | "business";
  status: string | null;
  credits: number;
};

export function BillingSuccessStatus({ sessionId }: { sessionId?: string }) {
  const [state, setState] = useState<BillingStatus | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [delayed, setDelayed] = useState(false);
  const reconciliationAttempted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function check() {
      try {
        if (sessionId && !reconciliationAttempted.current) {
          reconciliationAttempted.current = true;
          await fetch("/api/billing/reconcile", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
        }
        const response = await fetch("/api/billing/status", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("status_unavailable");
        const next = (await response.json()) as BillingStatus;
        if (cancelled) return;
        setState(next);
        if (next.plan !== "free") return;
      } catch {
        // A signed webhook remains the authority; keep polling briefly.
      }

      if (cancelled) return;
      setAttempts((current) => {
        const next = current + 1;
        if (next >= 12) {
          setDelayed(true);
        } else {
          timer = setTimeout(check, 2500);
        }
        return next;
      });
    }

    void check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId]);

  const active = Boolean(state && state.plan !== "free");

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="mx-auto max-w-xl text-center"
    >
      <div
        className={
          active
            ? "mx-auto grid size-16 place-items-center rounded-full bg-brand text-brand-ink"
            : "billing-status-pulse mx-auto grid size-16 place-items-center rounded-full border border-brand/35 bg-brand/8 text-brand"
        }
      >
        {active ? (
          <Check aria-hidden="true" className="size-7" />
        ) : (
          <LoaderCircle aria-hidden="true" className="size-7 animate-spin" />
        )}
      </div>

      <h1 className="mt-7 text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
        {active ? "Tu plan ya está listo." : "Estamos confirmando tu plan."}
      </h1>
      <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-muted">
        {active
          ? `Tu cuenta tiene ${state?.credits ?? 0} créditos disponibles. Ya puedes volver a crear.`
          : delayed
            ? "Stripe recibió el pago, pero la confirmación está tardando más de lo habitual. No vuelvas a pagar: revisa Facturación en unos minutos."
            : "Esperamos la confirmación segura de Stripe. Esta pantalla se actualizará automáticamente."}
      </p>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {active ? (
          <Button href="/create" size="lg">
            Crear ahora
          </Button>
        ) : delayed ? (
          <Button
            type="button"
            size="lg"
            onClick={() => {
              setAttempts(0);
              setDelayed(false);
              window.location.reload();
            }}
          >
            <RotateCw aria-hidden="true" className="size-4" />
            Revisar de nuevo
          </Button>
        ) : null}
        <Button href="/settings/billing" variant="secondary" size="lg">
          Ver facturación
        </Button>
      </div>
      {!active && !delayed && (
        <p className="mt-6 font-mono text-xs text-white/50">
          Verificación {Math.min(attempts + 1, 12)} de 12
        </p>
      )}
    </div>
  );
}
