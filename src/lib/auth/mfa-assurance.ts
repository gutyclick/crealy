import "server-only";

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
