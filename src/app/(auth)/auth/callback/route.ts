import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSafeRedirect } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const destination = getSafeRedirect(
    requestUrl.searchParams.get("next"),
    "/dashboard",
  );

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=auth_callback", requestUrl.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[Crealy Auth · callback] ${error.message}`);
    }
    return NextResponse.redirect(
      new URL("/login?error=auth_callback", requestUrl.origin),
    );
  }

  const cookieStore = await cookies();
  cookieStore.delete("crealy_verification_email");

  if (destination === "/reset-password") {
    cookieStore.set("crealy_recovery_session", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60,
      path: "/",
    });
  }

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
