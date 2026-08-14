"use client";

import { ExternalLink, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PortalButton({
  label = "Administrar en Stripe",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as {
        url?: string;
        error?: string;
        challengeUrl?: string;
      } | null;
      if (payload?.challengeUrl) {
        window.location.assign(payload.challengeUrl);
        return;
      }
      if (!response.ok || !payload?.url) {
        throw new Error(
          payload?.error || "No pudimos abrir el portal de facturación.",
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
    <div className={cn(className)}>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        disabled={loading}
        onClick={openPortal}
        className="w-full"
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
            {label}
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
