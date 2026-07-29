import { heading, opsClient } from "./client";

async function main() {
heading("Facturación (sólo lectura)");
const db = opsClient();
const [{ data: subscriptions, error }, { data: events }] = await Promise.all([
  db
    .from("subscriptions")
    .select("plan_key, status, current_period_end, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200),
  db
    .from("stripe_events")
    .select("event_type, status, attempts, error_code, created_at")
    .in("status", ["processing", "failed"])
    .order("created_at")
    .limit(100),
]);
if (error) throw error;

console.table(
  Object.entries(
    (subscriptions ?? []).reduce<Record<string, number>>((totals, row) => {
      const key = `${row.plan_key}:${row.status}`;
      totals[key] = (totals[key] ?? 0) + 1;
      return totals;
    }, {}),
  ).map(([state, count]) => ({ state, count })),
);
console.table(events ?? []);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Error operativo.");
  process.exitCode = 1;
});
