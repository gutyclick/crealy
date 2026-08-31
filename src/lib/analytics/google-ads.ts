"use client";

import {
  GOOGLE_ADS_CONSENT_COOKIE,
  GOOGLE_ADS_CONVERSION_SEND_TO,
} from "@/config/google-ads";

export type GoogleAdsConsent = "granted" | "denied";

export const GOOGLE_ADS_CONSENT_KEY = "crealy_google_ads_consent_v1";
const GOOGLE_ADS_PENDING_KEY = "crealy_google_ads_pending_conversions_v1";
const GOOGLE_ADS_SENT_PREFIX = "crealy_google_ads_conversion_sent:";
export const GOOGLE_ADS_CONSENT_EVENT = "crealy:google-ads-consent";
export const GOOGLE_ADS_CONVERSION_EVENT = "crealy:google-ads-conversion";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function storageAvailable() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function readGoogleAdsConsent(): GoogleAdsConsent | null {
  if (!storageAvailable()) return null;
  const value = window.localStorage.getItem(GOOGLE_ADS_CONSENT_KEY);
  if (value === "granted" || value === "denied") return value;
  const cookieValue = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${GOOGLE_ADS_CONSENT_COOKIE}=`))
    ?.split("=")[1];
  return cookieValue === "granted" || cookieValue === "denied"
    ? cookieValue
    : null;
}

export function saveGoogleAdsConsent(consent: GoogleAdsConsent) {
  if (!storageAvailable()) return;
  window.localStorage.setItem(GOOGLE_ADS_CONSENT_KEY, consent);
  document.cookie = `${GOOGLE_ADS_CONSENT_COOKIE}=${consent}; Max-Age=31536000; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  window.dispatchEvent(
    new CustomEvent(GOOGLE_ADS_CONSENT_EVENT, { detail: consent }),
  );
}

function readPendingConversions() {
  if (!storageAvailable()) return [] as string[];
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(GOOGLE_ADS_PENDING_KEY) || "[]",
    ) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function writePendingConversions(keys: string[]) {
  window.localStorage.setItem(
    GOOGLE_ADS_PENDING_KEY,
    JSON.stringify([...new Set(keys)].slice(-10)),
  );
}

export function queueGoogleAdsConversion(key: string) {
  if (!storageAvailable() || !key) return;
  if (window.localStorage.getItem(`${GOOGLE_ADS_SENT_PREFIX}${key}`)) return;
  writePendingConversions([...readPendingConversions(), key]);
  window.dispatchEvent(new Event(GOOGLE_ADS_CONVERSION_EVENT));
}

export function flushGoogleAdsConversions() {
  if (
    !storageAvailable() ||
    readGoogleAdsConsent() !== "granted" ||
    !window.gtag
  ) {
    return;
  }

  const pending = readPendingConversions();
  const remaining: string[] = [];
  for (const key of pending) {
    const sentKey = `${GOOGLE_ADS_SENT_PREFIX}${key}`;
    if (window.localStorage.getItem(sentKey)) continue;
    try {
      window.gtag("event", "conversion", {
        send_to: GOOGLE_ADS_CONVERSION_SEND_TO,
      });
      window.localStorage.setItem(sentKey, new Date().toISOString());
    } catch {
      remaining.push(key);
    }
  }
  writePendingConversions(remaining);
}
