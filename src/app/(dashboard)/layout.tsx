import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { requireUser } from "@/lib/auth/require-user";
import { getUserBillingState } from "@/lib/billing/get-user-billing-state";
import { ensureWelcomeCredits } from "@/lib/credits/credit-service";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { createClient } from "@/lib/supabase/server";
import type { JobStatus } from "@/types/jobs";
import type { PlanKey } from "@/types/billing";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

// This route-group layout is the authentication boundary for every private page.
// Any page placed under app/(dashboard) is protected by convention via requireUser().

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
  let plan: PlanKey = "free";
  const supabase = await createClient();
  const { data: activeJobs } = await supabase
    .from("jobs")
    .select("id, status, resource_id, created_at")
    .eq("user_id", user.id)
    .eq("job_type", "generation")
    .in("status", ["queued", "claimed", "processing", "retry_scheduled"])
    .order("created_at", { ascending: false })
    .limit(8);
  try {
    await ensureWelcomeCredits(user.id);
    const billing = await getUserBillingState(user.id);
    credits = billing.credits.available;
    plan = billing.effectivePlan.key;
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
        initialNotifications={(activeJobs ?? []).map((job) => ({
          jobId: job.id,
          generationId: job.resource_id,
          label: "Diseño en proceso",
          status: job.status as JobStatus,
          createdAt: job.created_at,
          unread: true,
        }))}
        plan={plan}
      />
      {children}
      <FeedbackWidget />
    </div>
  );
}
