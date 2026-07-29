"use client";

import { ExternalLink, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function PortalButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !payload.url) {
        throw new Error(
          payload.error || "No pudimos abrir el portal de facturación.",
        );
      }
      window.location.assign(payload.url);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No pudimos abrir el portal de facturación.",
      );
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        disabled={loading}
        onClick={openPortal}
      >
        {loading ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin"
            />
            Abriendo portal
          </>
        ) : (
          <>
            Administrar en Stripe
            <ExternalLink aria-hidden="true" className="size-4" />
          </>
        )}
      </Button>
      {message && (
        <p role="alert" className="mt-3 max-w-md text-sm text-red-300">
          {message}
        </p>
      )}
    </div>
  );
}
