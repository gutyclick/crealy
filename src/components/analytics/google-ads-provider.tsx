"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";

import { GOOGLE_ADS_ID, GOOGLE_TAG_MANAGER_ID } from "@/config/google-ads";
import {
  flushGoogleAdsConversions,
  GOOGLE_ADS_CONSENT_EVENT,
  GOOGLE_ADS_CONVERSION_EVENT,
  type GoogleAdsConsent,
  readGoogleAdsConsent,
  saveGoogleAdsConsent,
} from "@/lib/analytics/google-ads";

let googleTagInitialized = false;

function initializeGoogleTagManager() {
  if (googleTagInitialized) {
    flushGoogleAdsConversions();
    return;
  }
  googleTagInitialized = true;
  window.dataLayer = window.dataLayer || [];
  if (!window.dataLayer.some((entry) =>
    typeof entry === "object" && entry !== null && "gtm.start" in entry
  )) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  }
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

  useEffect(() => {
    if (consent === "granted") initializeGoogleTagManager();
  }, [consent]);

  const choose = useCallback((next: GoogleAdsConsent) => {
    saveGoogleAdsConsent(next);
    setConsent(next);
  }, []);

  return (
    <>
      {consent === "granted" ? (
        <Script
          id="crealy-google-ads"
          src={`https://www.googletagmanager.com/gtm.js?id=${GOOGLE_TAG_MANAGER_ID}`}
          strategy="afterInteractive"
          onReady={initializeGoogleTagManager}
        />
      ) : null}

      {consent === null ? (
        <aside
          aria-label="Preferencias de privacidad"
          className="fixed inset-x-3 bottom-3 z-[110] max-w-md rounded-[var(--radius-panel)] border border-white/10 bg-surface-elevated/95 p-4 shadow-[var(--shadow-tooltip)] backdrop-blur-md sm:bottom-5 sm:left-5 sm:right-auto sm:p-5"
        >
          <p className="text-sm font-semibold text-foreground">
            Medición opcional
          </p>
          <p className="mt-1.5 text-sm leading-5 text-muted">
            Nos ayuda a saber qué campañas funcionan. No compartimos tus
            diseños, prompts ni correo con Google.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => choose("denied")}
              className="min-h-11 rounded-[var(--radius-control)] border border-white/14 px-3 text-sm font-semibold text-foreground transition-colors hover:border-white/25 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Solo necesarias
            </button>
            <button
              type="button"
              onClick={() => choose("granted")}
              className="min-h-11 rounded-[var(--radius-control)] bg-brand px-3 text-sm font-bold text-brand-ink transition-colors hover:bg-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
            >
              Permitir medición
            </button>
          </div>
          <a
            href="/cookies"
            className="mt-3 inline-flex min-h-11 items-center text-xs font-medium text-muted underline decoration-white/20 underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Ver política de cookies
          </a>
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
