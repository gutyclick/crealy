import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { Logo } from "@/components/ui/logo";
import { requireUser } from "@/lib/auth/require-user";
import { getLaunchConfig } from "@/lib/launch/server";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Configura tu espacio",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const launch = getLaunchConfig();
  if (!launch.onboardingEnabled) redirect("/dashboard");
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_preferences")
    .select("onboarding_completed_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (data?.onboarding_completed_at) redirect("/dashboard");

  return (
    <main className="min-h-dvh bg-background px-5 py-6 sm:py-10">
      <div className="mx-auto mb-10 flex max-w-3xl items-center justify-between">
        <Logo />
        <span className="text-xs font-medium text-muted">Tu espacio creativo</span>
      </div>
      <OnboardingFlow />
    </main>
  );
}
