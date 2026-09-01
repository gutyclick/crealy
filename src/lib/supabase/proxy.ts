import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

const privateRoutes = [
  "/dashboard",
  "/create",
  "/edit",
  "/generations",
  "/settings",
  "/billing",
  "/onboarding",
  "/hq",
];
const guestOnlyRoutes = ["/login", "/signup", "/forgot-password"];

function copyAuthCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Keep this call adjacent to client creation so refreshed cookies stay aligned.
  const { data: claimsData } = await supabase.auth.getClaims();

  const isAuthenticated = Boolean(claimsData?.claims.sub);
  const pathname = request.nextUrl.pathname;
  const isPrivateRoute = privateRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isGuestOnlyRoute = guestOnlyRoutes.includes(pathname);

  if (!isAuthenticated && isPrivateRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname);
    return copyAuthCookies(response, NextResponse.redirect(loginUrl));
  }

  if (isAuthenticated && isGuestOnlyRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return copyAuthCookies(response, NextResponse.redirect(dashboardUrl));
  }

  return response;
}
