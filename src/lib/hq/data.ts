import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type HqIdentity = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastSignInAt: string | null;
};

export async function getHqIdentities() {
  const { data, error } = await createAdminClient().auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw new Error("hq_users_unavailable");
  return new Map(
    data.users.map((user) => [
      user.id,
      {
        id: user.id,
        email: user.email || "Sin correo",
        name:
          typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
            ? user.user_metadata.full_name.trim()
            : user.email?.split("@")[0] || "Usuario",
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at || null,
      } satisfies HqIdentity,
    ]),
  );
}

export async function getHqOverview() {
  const admin = createAdminClient();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [
    users,
    newUsers,
    generations,
    completed,
    failed,
    activeJobs,
    failedJobs,
    feedback,
    activeSubscriptions,
    recentGenerations,
    recentFeedback,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    admin.from("generations").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    admin.from("generations").select("id", { count: "exact", head: true }).eq("status", "completed").gte("created_at", weekAgo),
    admin.from("generations").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", weekAgo),
    admin.from("jobs").select("id", { count: "exact", head: true }).in("status", ["queued", "claimed", "processing", "retry_scheduled"]),
    admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", dayAgo),
    admin.from("generation_feedback").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    admin.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing", "past_due"]),
    admin.from("generations").select("id,user_id,status,content_type,requested_format,error_code,created_at,completed_at").order("created_at", { ascending: false }).limit(8),
    admin.from("generation_feedback").select("id,user_id,generation_id,verdict,reasons,comment,updated_at").order("updated_at", { ascending: false }).limit(6),
  ]);

  const responses = [users, newUsers, generations, completed, failed, activeJobs, failedJobs, feedback, activeSubscriptions, recentGenerations, recentFeedback];
  if (responses.some((response) => response.error)) {
    throw new Error("hq_overview_unavailable");
  }

  const total = generations.count || 0;
  const completedCount = completed.count || 0;
  const failedCount = failed.count || 0;
  return {
    metrics: {
      users: users.count || 0,
      newUsers: newUsers.count || 0,
      generations: total,
      successRate: total ? Math.round((completedCount / total) * 100) : 0,
      failed: failedCount,
      activeJobs: activeJobs.count || 0,
      failedJobs: failedJobs.count || 0,
      feedback: feedback.count || 0,
      subscriptions: activeSubscriptions.count || 0,
    },
    recentGenerations: recentGenerations.data || [],
    recentFeedback: recentFeedback.data || [],
  };
}
