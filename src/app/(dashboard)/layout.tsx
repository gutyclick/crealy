import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { requireUser } from "@/lib/auth/require-user";
import { getUserBillingState } from "@/lib/billing/get-user-billing-state";
import { ensureWelcomeCredits } from "@/lib/credits/credit-service";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { createClient } from "@/lib/supabase/server";
import type { JobStatus } from "@/types/jobs";
import type { PlanKey } from "@/types/billing";
import { MobileAppNavigation } from "@/components/dashboard/mobile-app-navigation";
import { MfaSecurityReminder } from "@/components/auth/mfa-security-reminder";
import { ActivityPing } from "@/components/dashboard/activity-ping";
import { CreditGiftDialog } from "@/components/dashboard/credit-gift-dialog";

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
  let reservedCredits = 0;
  let plan: PlanKey = "free";
  const supabase = await createClient();
  const [
    { data: activeJobs },
    { data: profile },
    { data: factors },
    { data: announcement },
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, status, resource_id, created_at")
      .eq("user_id", user.id)
      .eq("job_type", "generation")
      .in("status", ["queued", "claimed", "processing", "retry_scheduled"])
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("profiles")
      .select("mfa_reminder_disabled")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.auth.mfa.listFactors(),
    supabase
      .from("user_announcements")
      .select("id, credit_amount")
      .eq("user_id", user.id)
      .is("acknowledged_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  const cookieStore = await cookies();
  const hasVerifiedMfa = Boolean(
    factors?.totp.some((factor) => factor.status === "verified"),
  );
  const showMfaReminder =
    !hasVerifiedMfa &&
    profile?.mfa_reminder_disabled !== true &&
    cookieStore.get("crealy_mfa_reminder_dismissed")?.value !== "1";
  try {
    await ensureWelcomeCredits(user.id);
    const billing = await getUserBillingState(user.id);
    credits = billing.credits.available;
    reservedCredits = billing.credits.reserved;
    plan = billing.effectivePlan.key;
  } catch (error) {
    console.error("[Crealy Billing]", {
      action: "dashboard_state",
      errorCode: error instanceof Error ? error.message : "unknown",
    });
  }

  return (
    <div className="dashboard-shell min-h-dvh bg-background pb-24 lg:pb-0">
      <DashboardHeader
        userId={user.id}
        displayName={metadataName || fallbackName}
        email={user.email || "Cuenta de Crealy"}
        credits={credits}
        reservedCredits={reservedCredits}
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
      <ActivityPing userId={user.id} />
      {showMfaReminder ? <MfaSecurityReminder /> : null}
      {announcement?.credit_amount ? (
        <CreditGiftDialog
          announcementId={announcement.id}
          creditAmount={announcement.credit_amount}
          availableCredits={credits}
        />
      ) : null}
      {children}
      <MobileAppNavigation plan={plan} />
      <FeedbackWidget />
    </div>
  );
}
