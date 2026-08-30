"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";

import { GOOGLE_ADS_ID } from "@/config/google-ads";
import {
  flushGoogleAdsConversions,
  GOOGLE_ADS_CONSENT_EVENT,
  GOOGLE_ADS_CONVERSION_EVENT,
  type GoogleAdsConsent,
  readGoogleAdsConsent,
  saveGoogleAdsConsent,
} from "@/lib/analytics/google-ads";

function initializeGoogleTag() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
  window.gtag("consent", "default", {
    ad_storage: "granted",
    analytics_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  });
  window.gtag("js", new Date());
  window.gtag("config", GOOGLE_ADS_ID);
  flushGoogleAdsConversions();
}

export function GoogleAdsProvider() {
  const [consent, setConsent] = useState<GoogleAdsConsent | null | undefined>();

  useEffect(() => {
    const initialRead = window.setTimeout(() => {
      setConsent(readGoogleAdsConsent());
    }, 0);
    const updateConsent = (event: Event) => {
      const next = (event as CustomEvent<GoogleAdsConsent>).detail;
      setConsent(next);
      if (next === "denied" && window.gtag) {
        window.gtag("consent", "update", {
          ad_storage: "denied",
          analytics_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
      }
    };
    const flush = () => flushGoogleAdsConversions();
    window.addEventListener(GOOGLE_ADS_CONSENT_EVENT, updateConsent);
    window.addEventListener(GOOGLE_ADS_CONVERSION_EVENT, flush);
    return () => {
      window.clearTimeout(initialRead);
      window.removeEventListener(GOOGLE_ADS_CONSENT_EVENT, updateConsent);
      window.removeEventListener(GOOGLE_ADS_CONVERSION_EVENT, flush);
    };
  }, []);

  const choose = useCallback((next: GoogleAdsConsent) => {
    saveGoogleAdsConsent(next);
    setConsent(next);
  }, []);

  return (
    <>
      {consent === "granted" ? (
        <Script
          id="crealy-google-ads"
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
          strategy="afterInteractive"
          onReady={initializeGoogleTag}
        />
      ) : null}

      {consent === null ? (
        <aside
          aria-label="Preferencias de medición"
          className="fixed inset-x-4 bottom-4 z-[110] mx-auto max-w-2xl rounded-2xl border border-white/14 bg-surface-elevated p-4 shadow-[var(--shadow-tooltip)] sm:flex sm:items-center sm:gap-5 sm:p-5"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">Ayúdanos a medir qué funciona</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Google Ads puede medir visitas y compras para evaluar nuestras campañas.
              Solo se activa si aceptas. Consulta la {" "}
              <a href="/cookies" className="text-foreground underline hover:text-brand">
                Política de cookies
              </a>.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-0 sm:shrink-0">
            <button
              type="button"
              onClick={() => choose("denied")}
              className="h-11 rounded-[var(--radius-control)] border border-white/18 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.06]"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={() => choose("granted")}
              className="h-11 rounded-[var(--radius-control)] bg-brand px-4 text-sm font-bold text-brand-ink transition-colors hover:bg-[var(--brand-hover)]"
            >
              Aceptar medición
            </button>
          </div>
        </aside>
      ) : null}
    </>
  );
}

export function GoogleAdsConsentControls() {
  const [consent, setConsent] = useState<GoogleAdsConsent | null | undefined>();

  useEffect(() => {
    const initialRead = window.setTimeout(() => {
      setConsent(readGoogleAdsConsent());
    }, 0);
    return () => window.clearTimeout(initialRead);
  }, []);

  function choose(next: GoogleAdsConsent) {
    saveGoogleAdsConsent(next);
    setConsent(next);
  }

  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-sm text-muted">
        Preferencia actual: {consent === "granted" ? "medición aceptada" : consent === "denied" ? "medición rechazada" : "sin elegir"}.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => choose("granted")} className="min-h-11 rounded-[var(--radius-control)] bg-brand px-4 text-sm font-bold text-brand-ink">
          Aceptar medición
        </button>
        <button type="button" onClick={() => choose("denied")} className="min-h-11 rounded-[var(--radius-control)] border border-white/18 px-4 text-sm font-semibold text-foreground">
          Retirar o rechazar
        </button>
      </div>
    </div>
  );
}
