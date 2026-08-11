"use client";

import { ArrowRight, LoaderCircle, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { trackConversion } from "@/lib/analytics/events";
import type { BillingPeriod } from "@/config/plans";
import type { PaidPublicPlan } from "@/lib/billing/get-stripe-price-id";

export function CheckoutButton({
  plan,
  authenticated,
  enabled,
  planName,
  period,
  cta,
}: {
  plan: PaidPublicPlan;
  period: BillingPeriod;
  authenticated: boolean;
  enabled: boolean;
  planName: string;
  cta?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!consentOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) setConsentOpen(false);
      if (event.key === "Tab") {
        const focusable = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled])',
          ) ?? [],
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      openerRef.current?.focus();
    };
  }, [consentOpen, loading]);

  if (!authenticated) {
    const destination = `/pricing?plan=${plan}&period=${period}`;
    return (
      <Button href={`/signup?next=${encodeURIComponent(destination)}`} size="lg" className="w-full">
        Crear cuenta
        <ArrowRight aria-hidden="true" className="size-4" />
      </Button>
    );
  }

  async function openCheckout() {
    if (!consentAccepted) return;
    trackConversion("checkout_started", { plan });
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          plan,
          period,
          clientRequestId: crypto.randomUUID(),
          digitalSupplyConsent: true,
        }),
      });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
        challengeUrl?: string;
      };
      if (payload.challengeUrl) {
        window.location.assign(payload.challengeUrl);
        return;
      }
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "No pudimos abrir el pago seguro.");
      }
      window.location.assign(payload.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos abrir el pago seguro.");
      setLoading(false);
    }
  }

  function openConsent() {
    openerRef.current = document.activeElement as HTMLElement | null;
    setMessage(null);
    setConsentAccepted(false);
    setConsentOpen(true);
  }

  return (
    <div>
      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!enabled || loading}
        onClick={openConsent}
      >
        {enabled ? (
          <>
            {cta ?? `Elegir ${planName}`}
            <ArrowRight aria-hidden="true" className="size-4" />
          </>
        ) : (
          "Pagos no disponibles"
        )}
      </Button>

      {message && !consentOpen ? <p role="alert" className="mt-3 text-sm leading-6 text-red-300">{message}</p> : null}

      {consentOpen ? (
        <div className="fixed inset-0 z-[80] grid place-items-end bg-black/75 p-0 backdrop-blur-sm sm:place-items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) setConsentOpen(false); }}>
          <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={`checkout-consent-${plan}`} className="w-full max-w-lg rounded-t-2xl border border-white/10 bg-surface-elevated p-5 shadow-2xl sm:rounded-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                <ShieldCheck aria-hidden="true" className="size-5" />
              </div>
              <button ref={closeRef} type="button" onClick={() => setConsentOpen(false)} disabled={loading} aria-label="Cerrar" className="grid size-11 place-items-center rounded-xl text-muted transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50">
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <h2 id={`checkout-consent-${plan}`} className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-foreground">Activa {planName} sin esperar</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Stripe mostrará el precio final y solicitará aceptar los Términos antes de cobrarte. Crealy acreditará el plan cuando confirme el pago.</p>

            <label className="mt-6 flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-background/45 p-4 text-sm leading-6 text-foreground focus-within:border-brand/45">
              <input type="checkbox" checked={consentAccepted} onChange={(event) => setConsentAccepted(event.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]" />
              <span>Solicito que Crealy comience inmediatamente a prestar el servicio digital. Reconozco que, cuando el servicio se suministre o consuma, mi derecho de desistimiento puede reducirse o perderse en la medida permitida por la ley. Esto no limita mis derechos irrenunciables como consumidor.</span>
            </label>

            <p className="mt-4 text-xs leading-5 text-muted">Consulta los <Link href="/terms" target="_blank" className="text-foreground underline underline-offset-4 hover:text-brand">Términos</Link> y la <Link href="/refund-policy" target="_blank" className="text-foreground underline underline-offset-4 hover:text-brand">Política de reembolsos</Link>.</p>

            {message ? <p role="alert" className="mt-4 text-sm leading-6 text-red-300">{message}</p> : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
              <Button type="button" size="lg" disabled={!consentAccepted || loading} onClick={openCheckout} className="w-full">
                {loading ? <><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Abriendo Stripe</> : <>Continuar al pago seguro<ArrowRight aria-hidden="true" className="size-4" /></>}
              </Button>
              <Button type="button" size="lg" variant="secondary" disabled={loading} onClick={() => setConsentOpen(false)}>Ahora no</Button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
