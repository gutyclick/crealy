import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { MfaChallengeForm } from "@/components/auth/mfa-challenge-form";
import { getMfaAssurance } from "@/lib/auth/mfa-assurance";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSafeRedirect } from "@/lib/auth/redirects";

export const metadata: Metadata = { title: "Verificación en dos pasos" };

export default async function MfaChallengePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const nextPath = getSafeRedirect((await searchParams).next, "/dashboard");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  const assurance = await getMfaAssurance();
  if (assurance.currentLevel === "aal2") redirect(nextPath);
  const factorId = assurance.verifiedFactorIds[0];
  const required = nextPath === "/hq";
  if (!factorId) redirect(`/settings/security?mfaSetup=${required ? "required" : "optional"}&next=${encodeURIComponent(nextPath)}`);

  return (
    <AuthShell
      title={required ? "Confirma tu acceso a Crealy HQ." : "Una comprobación adicional."}
      description={
        required
          ? "Introduce el código de tu app de autenticación. Esta verificación es obligatoria para abrir el panel administrativo."
          : "Usa tu app de autenticación para elevar la seguridad de esta sesión. Puedes omitir este paso."
      }
    >
      <MfaChallengeForm factorId={factorId} nextPath={nextPath} required={required} />
    </AuthShell>
  );
}
