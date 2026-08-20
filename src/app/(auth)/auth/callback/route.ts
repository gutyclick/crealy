import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSafeRedirect } from "@/lib/auth/redirects";
import { OAUTH_RETURN_COOKIE, parseOAuthReturn } from "@/lib/auth/oauth-return";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import { getLaunchConfig } from "@/lib/launch/server";
import { queueTransactionalEmail } from "@/lib/email/queue-email";
import { claimBetaInvite } from "@/lib/launch/invites";
import { recordSignupConsents } from "@/lib/auth/signup-consent";
import { logger } from "@/lib/observability/logger";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const cookieStore = await cookies();
  const savedReturn = parseOAuthReturn(
    cookieStore.get(OAUTH_RETURN_COOKIE)?.value,
  );
  const oauthFlow =
    requestUrl.searchParams.get("oauth_flow") || savedReturn?.flow || null;
  const requestedDestination = requestUrl.searchParams.get("next");
  const destination = getSafeRedirect(
    requestedDestination || savedReturn?.destination,
    !requestedDestination && getLaunchConfig().onboardingEnabled
      ? "/onboarding"
      : "/dashboard",
  );

  if (!code) {
    logger.warn("auth.oauth_callback_missing_code", {
      errorCode: requestUrl.searchParams.has("error")
        ? "provider_rejected"
        : "missing_code",
    });
    cookieStore.delete(OAUTH_RETURN_COOKIE);
    cookieStore.set("crealy_oauth_invite", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/auth/callback",
    });
    cookieStore.set("crealy_oauth_consent", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/auth/callback",
    });
    return NextResponse.redirect(
      new URL("/login?error=auth_callback", requestUrl.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    cookieStore.delete(OAUTH_RETURN_COOKIE);
    logger.error("auth.oauth_code_exchange_failed", {
      errorCode: error.code || "code_exchange_failed",
    });
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
    Number.isFinite(createdAt) &&
    Number.isFinite(lastSignInAt) &&
    Date.now() - createdAt < 5 * 60_000 &&
    Math.abs(lastSignInAt - createdAt) < 10_000;

  const oauthInvite = cookieStore.get("crealy_oauth_invite")?.value || "";
  const oauthConsent = cookieStore.get("crealy_oauth_consent")?.value || "";
  const termsAccepted = oauthConsent.startsWith("accepted:");
  const marketingOptIn = oauthConsent === "accepted:marketing";
  let oauthInviteClaimed = !launch.inviteRequired;
  if (
    user?.email &&
    oauthFlow === "signup" &&
    isNewOAuthAccount &&
    launch.inviteRequired
  ) {
    oauthInviteClaimed = await claimBetaInvite(oauthInvite, user.email);
  }
  cookieStore.set("crealy_oauth_invite", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/auth/callback",
  });
  cookieStore.set("crealy_oauth_consent", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/auth/callback",
  });
  cookieStore.delete(OAUTH_RETURN_COOKIE);

  const newAccountIsRestricted =
    isNewOAuthAccount &&
    (!launch.registrationsEnabled ||
      (launch.inviteRequired &&
        (oauthFlow !== "signup" || !oauthInviteClaimed)) ||
      (oauthFlow === "signup" && !termsAccepted));

  if (user && newAccountIsRestricted) {
    logger.warn("auth.oauth_new_account_restricted", {
      errorCode: oauthFlow === "signup" ? "signup_requirements" : "login_flow",
    });
    await supabase.auth.signOut({ scope: "local" });
    await createAdminClient().auth.admin.deleteUser(user.id);
    return NextResponse.redirect(
      new URL(
        oauthFlow === "signup"
          ? "/signup?error=invite"
          : "/login?error=social_signup_restricted",
        requestUrl.origin,
      ),
    );
  }

  if (user && isNewOAuthAccount && oauthFlow === "signup") {
    const provider = user.app_metadata.provider;
    const source = provider === "discord" ? "discord_oauth" : "google_oauth";
    const recorded = await recordSignupConsents({
      userId: user.id,
      marketingOptIn,
      source,
    });
    if (!recorded) {
      logger.error("auth.oauth_consent_record_failed", {
        errorCode: "consent_record_failed",
      });
      await supabase.auth.signOut({ scope: "local" });
      await createAdminClient().auth.admin.deleteUser(user.id);
      return NextResponse.redirect(
        new URL("/signup?error=consent", requestUrl.origin),
      );
    }
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

  cookieStore.delete("crealy_verification_email");

  logger.info("auth.oauth_callback_completed", {
    provider:
      user?.app_metadata.provider === "discord" ? "discord" : "google",
    flow: oauthFlow === "signup" ? "signup" : "login",
    destination,
  });

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
