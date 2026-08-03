"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState } from "react";

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
        }),
      });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "No pudimos abrir el pago seguro.");
      }
      window.location.assign(payload.url);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No pudimos abrir el pago seguro.",
      );
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!enabled || loading}
        onClick={openCheckout}
      >
        {loading ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin"
            />
            Abriendo Stripe
          </>
        ) : enabled ? (
          <>
            {cta ?? `Elegir ${planName}`}
            <ArrowRight aria-hidden="true" className="size-4" />
          </>
        ) : (
          "Pagos no disponibles"
        )}
      </Button>
      {message && (
        <p role="alert" className="mt-3 text-sm leading-6 text-red-300">
          {message}
        </p>
      )}
    </div>
  );
}
