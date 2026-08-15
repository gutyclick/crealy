import type { Metadata } from "next";

import { RecreateForm } from "@/components/recreate/recreate-form";
import { Container } from "@/components/layout/container";
import { normalizeContentType } from "@/config/generation-products";
import { requireUser } from "@/lib/auth/require-user";
import { getBrandStyleAccess, listBrandStyles } from "@/lib/brand-styles/service";
import { getUserBillingState } from "@/lib/billing/get-user-billing-state";
import { getEditingServerEnv, isGenerationAvailable } from "@/lib/env/server";
import { getRecreateElementLimit } from "@/config/recreate";
import { createClient } from "@/lib/supabase/server";
import type { RecreateCategory } from "@/types/recreate";
import type { PlanKey } from "@/types/billing";

export const metadata: Metadata = {
  title: "Recreate",
  description: "Transforma una referencia visual en un diseño original para tu contenido.",
};

const RECREATE_TYPES = new Set<RecreateCategory>([
  "thumbnail",
  "social-post",
  "banner",
  "social-cover",
]);

export default async function RecreatePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; style?: string }>;
}) {
  const params = await searchParams;
  const normalizedType = params.type ? normalizeContentType(params.type) : null;
  const initialContentType = normalizedType && RECREATE_TYPES.has(normalizedType as RecreateCategory)
    ? normalizedType as RecreateCategory
    : "thumbnail";
  const user = await requireUser();
  const styleAccess = await getBrandStyleAccess(user.id);
  const brandStyles = styleAccess.entitlement.enabled
    ? await listBrandStyles(user.id)
    : [];
  let availableCredits: number | null = null;
  let planKey: PlanKey = "free";
  try {
    const billing = await getUserBillingState(user.id);
    availableCredits = billing.credits.available;
    planKey = billing.effectivePlan.key;
  } catch {
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
    maxReferenceFileMb = getEditingServerEnv().maxReferenceImageBytes / 1024 / 1024;
  } catch {
    // Keep safe client guidance if production configuration is temporarily unavailable.
  }

  return (
    <main className="py-6 sm:py-10">
      <Container>
        <RecreateForm
          available={isGenerationAvailable()}
          availableCredits={availableCredits}
          maxReferenceFileMb={maxReferenceFileMb}
          maxElements={getRecreateElementLimit(planKey)}
          planKey={planKey}
          initialContentType={initialContentType}
          brandStyles={brandStyles}
          initialBrandStyleId={typeof params.style === "string" ? params.style : undefined}
        />
      </Container>
    </main>
  );
}
