import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSafeRedirect } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";

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

  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email && process.env.STRIPE_SECRET_KEY?.trim()) {
    try {
      const { data: customer } = await createAdminClient()
        .from("billing_customers")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (customer) {
        await getStripeClient().customers.update(customer.stripe_customer_id, {
          email: user.email,
        });
      }
    } catch {
      // Auth confirmation must not fail if a downstream billing sync is unavailable.
    }
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
