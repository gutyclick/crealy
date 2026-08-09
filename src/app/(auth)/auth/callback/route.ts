import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSafeRedirect } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import { getLaunchConfig } from "@/lib/launch/server";
import { queueTransactionalEmail } from "@/lib/email/queue-email";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthFlow = requestUrl.searchParams.get("oauth_flow");
  const requestedDestination = requestUrl.searchParams.get("next");
  const destination = getSafeRedirect(
    requestedDestination,
    !requestedDestination && getLaunchConfig().onboardingEnabled
      ? "/onboarding"
      : "/dashboard",
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
  const launch = getLaunchConfig();
  const createdAt = user?.created_at ? Date.parse(user.created_at) : Number.NaN;
  const lastSignInAt = user?.last_sign_in_at
    ? Date.parse(user.last_sign_in_at)
    : Number.NaN;
  const isNewOAuthAccount =
    oauthFlow === "login" &&
    Number.isFinite(createdAt) &&
    Number.isFinite(lastSignInAt) &&
    Date.now() - createdAt < 5 * 60_000 &&
    Math.abs(lastSignInAt - createdAt) < 10_000;

  if (
    user &&
    isNewOAuthAccount &&
    (!launch.registrationsEnabled || launch.inviteRequired)
  ) {
    await supabase.auth.signOut({ scope: "local" });
    await createAdminClient().auth.admin.deleteUser(user.id);
    return NextResponse.redirect(
      new URL("/login?error=social_signup_restricted", requestUrl.origin),
    );
  }

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
  if (user?.email_confirmed_at) {
    await queueTransactionalEmail({
      userId: user.id,
      type: "welcome",
      idempotencyKey: `welcome:${user.id}`,
    }).catch(() => null);
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
