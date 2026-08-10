"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { AuthActionState } from "@/lib/auth/action-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { recordSignupConsents } from "@/lib/auth/signup-consent";
import { getSafeRedirect } from "@/lib/auth/redirects";
import {
  errorState,
  normalizeEmail,
  readText,
  validateEmail,
  validatePassword,
} from "@/lib/auth/validation";
import { getSiteUrl } from "@/lib/env";
import { claimBetaInvite, validateBetaInvite } from "@/lib/launch/invites";
import { getLaunchConfig } from "@/lib/launch/server";
import {
  enforceRateLimit,
  RATE_LIMITS,
} from "@/lib/operations/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/config/legal";

const genericResetMessage =
  "Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña.";

function reportAuthError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "development") return;

  const message = error instanceof Error ? error.message : "Error desconocido";
  console.error(`[Crealy Auth · ${context}] ${message}`);
}

async function authRateLimited(action: string) {
  try {
    const incoming = await headers();
    const request = new Request(getSiteUrl(), { headers: incoming });
    const result = await enforceRateLimit({
      request,
      action: `auth.${action}`,
      ipPolicy: RATE_LIMITS.authIp,
    });
    return !result.allowed;
  } catch {
    return true;
  }
}

export async function signUp(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const launch = getLaunchConfig();
  if (!launch.registrationsEnabled) {
    return errorState(
      "El registro está temporalmente cerrado. Puedes volver a intentarlo más adelante.",
    );
  }
  if (await authRateLimited("signup")) {
    return errorState("Demasiados intentos. Espera unos minutos.");
  }
  const name = readText(formData, "name").trim();
  const email = normalizeEmail(readText(formData, "email"));
  const password = readText(formData, "password");
  const confirmPassword = readText(formData, "confirmPassword");
  const inviteCode = readText(formData, "inviteCode").trim();
  const termsAccepted = formData.get("termsAccepted") === "on";
  const marketingOptIn = formData.get("marketingOptIn") === "on";
  const destination = getSafeRedirect(
    formData.get("next"),
    launch.onboardingEnabled ? "/onboarding" : "/dashboard",
  );
  const fieldErrors: AuthActionState["fieldErrors"] = {};

  if (name.length < 2 || name.length > 60) {
    fieldErrors.name = "El nombre debe tener entre 2 y 60 caracteres.";
  }
  fieldErrors.email = validateEmail(email);
  fieldErrors.password = validatePassword(password);
  if (!confirmPassword || confirmPassword !== password) {
    fieldErrors.confirmPassword = "Las contraseñas deben coincidir.";
  }
  if (launch.inviteRequired && !inviteCode) {
    fieldErrors.inviteCode = "Introduce el código de invitación.";
  }
  if (!termsAccepted) {
    fieldErrors.terms = "Debes aceptar los términos y la política de privacidad.";
  }

  const presentErrors = Object.fromEntries(
    Object.entries(fieldErrors).filter(([, value]) => Boolean(value)),
  );

  if (Object.keys(presentErrors).length > 0) {
    return errorState(
      "Revisa los campos e inténtalo nuevamente.",
      presentErrors,
      { name, email },
    );
  }

  if (
    launch.inviteRequired &&
    !(await validateBetaInvite(inviteCode, email))
  ) {
    return errorState(
      "No pudimos validar el acceso a la beta. Revisa el código e inténtalo de nuevo.",
      { inviteCode: "El código no está disponible o ha expirado." },
      { name, email },
    );
  }

  const supabase = await createClient();
  let result;

  try {
    result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          terms_accepted: true,
          terms_version: CURRENT_TERMS_VERSION,
          privacy_version: CURRENT_PRIVACY_VERSION,
          marketing_opt_in: marketingOptIn,
        },
        emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(destination)}`,
      },
    });
  } catch (error) {
    reportAuthError("registro", error);
    return errorState("No pudimos crear tu cuenta en este momento.", undefined, {
      name,
      email,
    });
  }

  if (result.error) {
    reportAuthError("registro", result.error);
    return errorState("No pudimos crear tu cuenta en este momento.", undefined, {
      name,
      email,
    });
  }

  // Supabase intentionally returns an obfuscated user for an existing account.
  // Only a response with a newly created identity may consume an invite or
  // write signup consent for that user.
  const createdUserId =
    result.data.user && (result.data.user.identities?.length ?? 0) > 0
      ? result.data.user.id
      : null;

  if (launch.inviteRequired && createdUserId) {
    const claimed = await claimBetaInvite(inviteCode, email);
    if (!claimed) {
      await createAdminClient().auth.admin.deleteUser(createdUserId);
      return errorState(
        "No pudimos validar el acceso a la beta. Revisa el código e inténtalo de nuevo.",
        { inviteCode: "El código no está disponible o ha expirado." },
        { name, email },
      );
    }
  }

  if (createdUserId) {
    const recorded = await recordSignupConsents({
      userId: createdUserId,
      marketingOptIn,
      source: "email_signup",
    });
    if (!recorded) {
      reportAuthError("consentimiento de registro", new Error("consent_record_failed"));
      await createAdminClient().auth.admin.deleteUser(createdUserId);
      return errorState(
        "No pudimos guardar tus preferencias. Inténtalo nuevamente.",
        undefined,
        { name, email },
      );
    }
  }

  if (result.data.session) {
    revalidatePath("/", "layout");
    redirect(destination);
  }

  const cookieStore = await cookies();
  cookieStore.set("crealy_verification_email", email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60,
    path: "/",
  });

  redirect(`/verify-email?next=${encodeURIComponent(destination)}`);
}

export async function signIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (await authRateLimited("signin")) {
    return errorState("Demasiados intentos. Espera unos minutos.");
  }
  const email = normalizeEmail(readText(formData, "email"));
  const password = readText(formData, "password");
  const destination = getSafeRedirect(
    formData.get("next"),
    "/dashboard",
  );
  const fieldErrors: AuthActionState["fieldErrors"] = {
    email: validateEmail(email),
    password: password ? undefined : "Introduce tu contraseña.",
  };
  const presentErrors = Object.fromEntries(
    Object.entries(fieldErrors).filter(([, value]) => Boolean(value)),
  );

  if (Object.keys(presentErrors).length > 0) {
    return errorState(
      "Revisa los campos e inténtalo nuevamente.",
      presentErrors,
      { email },
    );
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      reportAuthError("inicio de sesión", error);
      return errorState("No pudimos iniciar sesión con esos datos.", undefined, {
        email,
      });
    }
  } catch (error) {
    reportAuthError("inicio de sesión", error);
    return errorState("No pudimos iniciar sesión con esos datos.", undefined, {
      email,
    });
  }

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2") {
    redirect(`/mfa-challenge?next=${encodeURIComponent(destination)}`);
  }

  revalidatePath("/", "layout");
  redirect(destination);
}

type SocialAuthProvider = "google" | "discord";

const socialAuthConfig: Record<SocialAuthProvider, { flag: string; label: string }> = {
  google: { flag: "NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", label: "Google" },
  discord: { flag: "NEXT_PUBLIC_DISCORD_AUTH_ENABLED", label: "Discord" },
};

async function signInWithSocialProvider(
  provider: SocialAuthProvider,
  formData: FormData,
) {
  const config = socialAuthConfig[provider];
  const launch = getLaunchConfig();
  const isSignup = readText(formData, "flow") === "signup";
  const inviteCode = readText(formData, "inviteCode").trim();
  const termsAccepted = formData.get("termsAccepted") === "on";
  const marketingOptIn = formData.get("marketingOptIn") === "on";
  if (
    process.env[config.flag] !== "true" ||
    (isSignup && !launch.registrationsEnabled)
  ) {
    redirect("/login?error=oauth");
  }
  if (
    isSignup &&
    launch.inviteRequired &&
    (inviteCode.length < 12 || inviteCode.length > 160)
  ) {
    redirect("/signup?error=invite");
  }
  if (isSignup && !termsAccepted) {
    redirect("/signup?error=terms");
  }
  if (await authRateLimited(`${provider}_oauth`)) {
    redirect("/login?error=rate_limited");
  }
  const cookieStore = await cookies();
  if (isSignup && launch.inviteRequired) {
    cookieStore.set("crealy_oauth_invite", inviteCode, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
      path: "/auth/callback",
    });
  }
  if (isSignup) {
    cookieStore.set(
      "crealy_oauth_consent",
      marketingOptIn ? "accepted:marketing" : "accepted:essential",
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60,
        path: "/auth/callback",
      },
    );
  }
  const destination = getSafeRedirect(
    formData.get("next"),
    isSignup && launch.onboardingEnabled ? "/onboarding" : "/dashboard",
  );
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(destination)}&oauth_flow=${isSignup ? "signup" : "login"}`,
    },
  });
  if (error || !data.url) {
    reportAuthError(`${config.label} OAuth`, error);
    redirect("/login?error=oauth");
  }
  redirect(data.url);
}

export async function signInWithGoogle(formData: FormData) {
  return signInWithSocialProvider("google", formData);
}

export async function signInWithDiscord(formData: FormData) {
  return signInWithSocialProvider("discord", formData);
}

export async function requestPasswordReset(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (await authRateLimited("password_reset")) {
    return errorState(genericResetMessage);
  }
  const email = normalizeEmail(readText(formData, "email"));
  const emailError = validateEmail(email);

  if (emailError) {
    return errorState(
      "Revisa los campos e inténtalo nuevamente.",
      { email: emailError },
      { email },
    );
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
    });
    if (error) reportAuthError("recuperación", error);
  } catch (error) {
    reportAuthError("recuperación", error);
  }

  return {
    status: "success",
    message: genericResetMessage,
  };
}

export async function resendVerificationEmail(
  previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (await authRateLimited("resend_verification")) {
    return errorState("Espera unos minutos antes de solicitar otro correo.");
  }
  void previousState;
  const destination = getSafeRedirect(formData.get("next"), "/dashboard");
  const cookieStore = await cookies();
  const email = cookieStore.get("crealy_verification_email")?.value;

  if (!email || validateEmail(email)) {
    return errorState(
      "No encontramos una verificación pendiente. Vuelve a crear tu cuenta.",
    );
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(destination)}`,
      },
    });

    if (error) {
      reportAuthError("reenvío de verificación", error);
      return errorState(
        "No pudimos reenviar el correo. Espera un momento e inténtalo de nuevo.",
      );
    }
  } catch (error) {
    reportAuthError("reenvío de verificación", error);
    return errorState(
      "No pudimos reenviar el correo. Espera un momento e inténtalo de nuevo.",
    );
  }

  return {
    status: "success",
    message: "Enviamos un nuevo enlace de confirmación.",
  };
}

export async function updatePassword(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = readText(formData, "password");
  const confirmPassword = readText(formData, "confirmPassword");
  const passwordError = validatePassword(password);
  const fieldErrors: AuthActionState["fieldErrors"] = {
    password: passwordError,
    confirmPassword:
      !confirmPassword || password !== confirmPassword
        ? "Las contraseñas deben coincidir."
        : undefined,
  };
  const presentErrors = Object.fromEntries(
    Object.entries(fieldErrors).filter(([, value]) => Boolean(value)),
  );

  if (Object.keys(presentErrors).length > 0) {
    return errorState(
      "Revisa los campos e inténtalo nuevamente.",
      presentErrors,
    );
  }

  const cookieStore = await cookies();
  const hasRecoverySession =
    cookieStore.get("crealy_recovery_session")?.value === "1";
  const user = await getCurrentUser();

  if (!user || !hasRecoverySession) {
    return errorState(
      "El enlace ya no es válido. Solicita uno nuevo.",
    );
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      reportAuthError("nueva contraseña", error);
      return errorState(
        "No pudimos actualizar tu contraseña. Solicita un enlace nuevo.",
      );
    }
  } catch (error) {
    reportAuthError("nueva contraseña", error);
    return errorState(
      "No pudimos actualizar tu contraseña. Solicita un enlace nuevo.",
    );
  }

  cookieStore.delete("crealy_recovery_session");
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    reportAuthError("cierre de sesión", error);
    await supabase.auth.signOut({ scope: "local" });
  }

  revalidatePath("/", "layout");
  redirect("/");
}
