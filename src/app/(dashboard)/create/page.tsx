import type { Metadata } from "next";

import { GenerationForm } from "@/components/generation/generation-form";
import { Container } from "@/components/layout/container";
import {
  getEditingServerEnv,
  isGenerationAvailable,
} from "@/lib/env/server";
import type { ContentType } from "@/types/generation";
import { requireUser } from "@/lib/auth/require-user";
import { getUserBillingState } from "@/lib/billing/get-user-billing-state";
import { normalizeContentType } from "@/config/generation-products";
import { createClient } from "@/lib/supabase/server";
import { getBrandStyleAccess, listBrandStyles } from "@/lib/brand-styles/service";
import { getOnboardingObjective } from "@/config/onboarding";

/*
THESIS: Crear debe sentirse como dirigir una pieza visual, no operar un panel técnico.
OWN-WORLD: estudio mate de producción; controles compactos, lienzo dominante y lima reservado para decisiones activas.
STORY: la persona elige el destino, describe la idea, calibra el estilo y recibe una imagen descargable sin cambiar de contexto.
FIRST VIEWPORT: brief secuencial a la izquierda y resultado persistente a la derecha; en móvil, intención antes que resultado.
FORM: híbrido de las composiciones A y C, sin stepper artificial; formulario continuo + canvas sticky.
*/

export const metadata: Metadata = {
  title: "Crear",
  description: "Genera una nueva pieza visual con Crealy.",
};

const CONTENT_TYPES = new Set<ContentType>([
  "thumbnail",
  "social-post",
  "banner",
  "social-cover",
  "story",
  "profile-image",
]);

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; style?: string; onboarding?: string }>;
}) {
  const params = await searchParams;
  const onboardingObjective = getOnboardingObjective(params.onboarding);
  const requestedType = params.type;
  const normalizedType = requestedType ? normalizeContentType(requestedType) : null;
  const initialContentType =
    normalizedType && CONTENT_TYPES.has(normalizedType)
      ? normalizedType
      : onboardingObjective?.contentType;
  const user = await requireUser();
  const styleAccess = await getBrandStyleAccess(user.id);
  const brandStyles = styleAccess.entitlement.enabled ? await listBrandStyles(user.id) : [];
  let availableCredits: number | null = null;
  try {
    availableCredits = (await getUserBillingState(user.id)).credits.available;
  } catch {
    // Billing metadata must never turn a transient read failure into a fake
    // zero balance that blocks creation. The API remains authoritative.
    const supabase = await createClient();
    const { data: account } = await supabase
      .from("credit_accounts")
      .select("available_balance")
      .eq("user_id", user.id)
      .maybeSingle();
    availableCredits = account?.available_balance ?? null;
  }
  let maxReferenceFileMb = 10;
  try {
    maxReferenceFileMb =
      getEditingServerEnv().maxReferenceImageBytes / 1024 / 1024;
  } catch {
    // Keep safe client guidance when environment configuration is incomplete.
  }

  return (
    <main className="py-6 sm:py-10">
      <Container>
        <GenerationForm
          available={isGenerationAvailable()}
          availableCredits={availableCredits}
          maxReferenceFileMb={maxReferenceFileMb}
          initialContentType={initialContentType}
          brandStyles={brandStyles}
          brandStyleEntitlement={styleAccess.entitlement}
          initialBrandStyleId={typeof params.style === "string" ? params.style : undefined}
          initialOnboardingObjective={onboardingObjective ?? undefined}
        />
      </Container>
    </main>
  );
}
