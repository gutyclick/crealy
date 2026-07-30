import type { Metadata } from "next";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { requireUser } from "@/lib/auth/require-user";
import { listGenerations } from "@/lib/generation/list-generations";
import { createClient } from "@/lib/supabase/server";
import { listRecentEditSessions } from "@/lib/editing/get-edit-session";
import { getUserBillingState } from "@/lib/billing/get-user-billing-state";

/*
THESIS: El dashboard orienta la primera acción sin fingir un producto terminado ni llenar el espacio con datos falsos.
OWN-WORLD: mesa oscura, divisiones mate, proporciones de contenido reales y lima reservada para el siguiente paso disponible.
STORY: la persona reconoce su cuenta, entiende qué podrá crear y encuentra un estado inicial honesto.
FIRST VIEWPORT: saludo y acción principal a la izquierda; formatos compactos y estado del producto a la derecha.
FORM: superficie Operate contenida, sin sidebar prematura, con barra superior y contenido adaptable.
*/

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error && process.env.NODE_ENV === "development") {
    console.error(`[Crealy Dashboard · perfil] ${error.message}`);
  }

  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const localEmailName = user.email?.split("@")[0] || "";
  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ||
    metadataName.split(/\s+/)[0] ||
    localEmailName;
  const [recentGenerations, recentEditSessions, activeJobsResult, billing, preferences] =
    await Promise.all([
      listGenerations(user.id, 8),
      listRecentEditSessions(user.id, 4),
      supabase
        .from("jobs")
        .select("id, job_type, status, resource_id, created_at")
        .eq("user_id", user.id)
        .in("job_type", ["generation", "edit"])
        .in("status", ["queued", "claimed", "processing", "retry_scheduled"])
        .order("created_at", { ascending: false })
        .limit(5),
      getUserBillingState(user.id).catch(() => null),
      supabase
        .from("user_preferences")
        .select("onboarding_completed_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  return (
    <DashboardHome
      firstName={firstName || undefined}
      recentGenerations={recentGenerations}
      recentEditSessions={recentEditSessions}
      activeJobs={(activeJobsResult.data ?? []).map((job) => ({
        id: job.id,
        type: job.job_type,
        status: job.status,
        resourceId: job.resource_id,
        createdAt: job.created_at,
      }))}
      plan={billing?.effectivePlan.key ?? "free"}
      credits={billing?.credits.available ?? 0}
      onboardingChecklist={{
        emailConfirmed: Boolean(user.email_confirmed_at),
        profileCompleted: Boolean(profile?.full_name?.trim()),
        onboardingCompleted: Boolean(preferences.data?.onboarding_completed_at),
        firstDesignCreated: recentGenerations.length > 0,
        editorTried: recentEditSessions.length > 0,
      }}
    />
  );
}
