import { execute, heading, opsClient } from "./client";

async function main() {
heading("Jobs y cola");
const db = opsClient();
const { data: jobs, error } = await db
  .from("jobs")
  .select(
    "id, job_type, status, attempt_count, max_attempts, available_at, visibility_expires_at, error_code, created_at",
  )
  .order("created_at", { ascending: false })
  .limit(100);
if (error) throw error;

const summary = Object.entries(
  (jobs ?? []).reduce<Record<string, number>>((totals, job) => {
    totals[job.status] = (totals[job.status] ?? 0) + 1;
    return totals;
  }, {}),
).map(([status, count]) => ({ status, count }));
console.table(summary);

const stuck = (jobs ?? []).filter(
  (job) =>
    ["claimed", "processing"].includes(job.status) &&
    job.visibility_expires_at &&
    new Date(job.visibility_expires_at) < new Date(),
);
console.table(stuck);

if (execute) {
  const { data, error: recoveryError } = await db.rpc(
    "recover_stuck_jobs_internal",
    { p_limit: 100 },
  );
  if (recoveryError) throw recoveryError;
  console.log(`Jobs recuperados: ${data ?? 0}`);
}
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Error operativo.");
  process.exitCode = 1;
});
