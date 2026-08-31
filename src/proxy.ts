import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";

import { updateSession } from "@/lib/supabase/proxy";
import { OAUTH_RETURN_COOKIE, parseOAuthReturn } from "@/lib/auth/oauth-return";
import { getCanonicalSiteUrl } from "@/lib/env";

function canonicalBrowserRedirect(request: NextRequest) {
  if (
    process.env.NODE_ENV !== "production" ||
    request.nextUrl.pathname.startsWith("/api/")
  ) {
    return null;
  }

  const canonical = new URL(getCanonicalSiteUrl());
  const currentHost = request.nextUrl.hostname;
  const isCrealyAlias =
    (currentHost === "crealy.app" || currentHost === "www.crealy.app") &&
    (canonical.hostname === "crealy.app" || canonical.hostname === "www.crealy.app");
  if (!isCrealyAlias || currentHost === canonical.hostname) return null;

  const destination = request.nextUrl.clone();
  destination.protocol = canonical.protocol;
  destination.hostname = canonical.hostname;
  destination.port = canonical.port;
  return NextResponse.redirect(destination, 308);
}

export async function proxy(request: NextRequest) {
  const canonicalRedirect = canonicalBrowserRedirect(request);
  if (canonicalRedirect) return canonicalRedirect;

  const savedReturn = parseOAuthReturn(
    request.cookies.get(OAUTH_RETURN_COOKIE)?.value,
  );
  const oauthCode = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");
  if (request.nextUrl.pathname === "/" && (oauthCode || oauthError)) {
    const callbackUrl = new URL("/auth/callback", request.url);
    for (const parameter of [
      "code",
      "error",
      "error_code",
      "error_description",
    ]) {
      const value = request.nextUrl.searchParams.get(parameter);
      if (value) callbackUrl.searchParams.set(parameter, value);
    }
    if (savedReturn) {
      callbackUrl.searchParams.set("next", savedReturn.destination);
      callbackUrl.searchParams.set("oauth_flow", savedReturn.flow);
    }
    return NextResponse.redirect(callbackUrl);
  }

  const nonce = randomBytes(16).toString("base64");
  request.headers.set("x-nonce", nonce);
  const response = await updateSession(request);
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://va.vercel-scripts.com https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://*.supabase.co https://*.r2.cloudflarestorage.com https://*.google.com https://www.googletagmanager.com https://*.google-analytics.com https://*.googleadservices.com https://*.doubleclick.net",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.r2.cloudflarestorage.com https://api.stripe.com https://vitals.vercel-insights.com https://*.vercel-insights.com https://*.ingest.sentry.io https://*.google-analytics.com https://*.googleadservices.com https://*.googletagmanager.com https://*.doubleclick.net",
    "frame-src https://checkout.stripe.com https://js.stripe.com https://www.googletagmanager.com",
    ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
