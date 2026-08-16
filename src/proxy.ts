import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";

import { updateSession } from "@/lib/supabase/proxy";
import { OAUTH_RETURN_COOKIE, parseOAuthReturn } from "@/lib/auth/oauth-return";

export async function proxy(request: NextRequest) {
  const savedReturn = parseOAuthReturn(
    request.cookies.get(OAUTH_RETURN_COOKIE)?.value,
  );
  const oauthCode = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");
  if (request.nextUrl.pathname === "/" && savedReturn && (oauthCode || oauthError)) {
    const callbackUrl = new URL("/auth/callback", request.url);
    if (oauthCode) callbackUrl.searchParams.set("code", oauthCode);
    if (oauthError) callbackUrl.searchParams.set("error", oauthError);
    callbackUrl.searchParams.set("next", savedReturn.destination);
    callbackUrl.searchParams.set("oauth_flow", savedReturn.flow);
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
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://*.supabase.co https://*.r2.cloudflarestorage.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.r2.cloudflarestorage.com https://api.stripe.com https://vitals.vercel-insights.com https://*.vercel-insights.com https://*.ingest.sentry.io",
    "frame-src https://checkout.stripe.com https://js.stripe.com",
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
