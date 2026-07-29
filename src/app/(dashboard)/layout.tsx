import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { requireUser } from "@/lib/auth/require-user";
import { getUserBillingState } from "@/lib/billing/get-user-billing-state";
import { ensureWelcomeCredits } from "@/lib/credits/credit-service";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const fallbackName = user.email?.split("@")[0] || "Tu cuenta";
  let credits: number | null = null;
  try {
    await ensureWelcomeCredits(user.id);
    const billing = await getUserBillingState(user.id);
    credits = billing.credits.available;
  } catch (error) {
    console.error("[Crealy Billing]", {
      action: "dashboard_state",
      errorCode: error instanceof Error ? error.message : "unknown",
    });
  }

  return (
    <div className="min-h-dvh bg-background">
      <DashboardHeader
        displayName={metadataName || fallbackName}
        email={user.email || "Cuenta de Crealy"}
        credits={credits}
      />
      {children}
    </div>
  );
}
