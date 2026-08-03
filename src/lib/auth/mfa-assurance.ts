import "server-only";

import { redirect } from "next/navigation";

import { getSafeRedirect } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

export type MfaAssurance = {
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
  verifiedFactorIds: string[];
};

function assuranceLevel(value: string | null): "aal1" | "aal2" | null {
  return value === "aal1" || value === "aal2" ? value : null;
}

export async function getMfaAssurance(): Promise<MfaAssurance> {
  const supabase = await createClient();
  const [{ data: assurance, error: assuranceError }, { data: factors, error: factorsError }] =
    await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ]);

  if (assuranceError || factorsError) throw new Error("mfa_assurance_unavailable");

  return {
    currentLevel: assuranceLevel(assurance.currentLevel),
    nextLevel: assuranceLevel(assurance.nextLevel),
    verifiedFactorIds: factors.totp
      .filter((factor) => factor.status === "verified")
      .map((factor) => factor.id),
  };
}

export async function requireAal2(nextPath: string) {
  const safeNext = getSafeRedirect(nextPath, "/dashboard");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(safeNext)}`);

  const assurance = await getMfaAssurance();
  if (assurance.currentLevel === "aal2") return user;
  if (!assurance.verifiedFactorIds.length) {
    redirect(`/settings/security?mfaSetup=required&next=${encodeURIComponent(safeNext)}`);
  }
  redirect(`/mfa-challenge?next=${encodeURIComponent(safeNext)}`);
}

export async function getAal2ApiAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, code: "unauthorized", challengeUrl: "/login" };

  let assurance: MfaAssurance;
  try {
    assurance = await getMfaAssurance();
  } catch {
    return { ok: false as const, status: 503, code: "mfa_unavailable", challengeUrl: "/settings/security" };
  }
  if (assurance.currentLevel === "aal2") return { ok: true as const, user };
  const enrolled = assurance.verifiedFactorIds.length > 0;
  return {
    ok: false as const,
    status: 403,
    code: enrolled ? "mfa_challenge_required" : "mfa_enrollment_required",
    challengeUrl: enrolled
      ? "/mfa-challenge?next=%2Fsettings%2Fbilling"
      : "/settings/security?mfaSetup=required&next=%2Fsettings%2Fbilling",
  };
}
