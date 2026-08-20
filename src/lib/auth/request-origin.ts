import "server-only";

import { headers } from "next/headers";

import { getCanonicalSiteUrl, getSiteUrl } from "@/lib/env";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || "";
}

function canonicalVariants(hostname: string) {
  const apex = hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  return new Set([apex, `www.${apex}`]);
}

export async function getAuthRedirectOrigin() {
  const configured = new URL(getSiteUrl());
  if (process.env.NODE_ENV === "production") {
    return getCanonicalSiteUrl();
  }
  const incoming = await headers();
  const forwardedHost = firstHeaderValue(
    incoming.get("x-forwarded-host") || incoming.get("host"),
  );
  const forwardedProtocol = firstHeaderValue(
    incoming.get("x-forwarded-proto"),
  );
  if (!forwardedHost) return configured.origin;

  try {
    const protocol = forwardedProtocol || configured.protocol.replace(":", "");
    const candidate = new URL(`${protocol}://${forwardedHost}`);
    const allowedHosts = canonicalVariants(configured.hostname);
    if (
      allowedHosts.has(candidate.hostname) &&
      (!candidate.port || candidate.port === configured.port)
    ) {
      return candidate.origin;
    }
  } catch {
    // Fall back to the configured origin when forwarded headers are malformed.
  }

  return configured.origin;
}

export async function getAuthCallbackUrl(
  destination: string,
  oauthFlow?: "login" | "signup",
) {
  const url = new URL("/auth/callback", await getAuthRedirectOrigin());
  url.searchParams.set("next", destination);
  if (oauthFlow) url.searchParams.set("oauth_flow", oauthFlow);
  return url.toString();
}
