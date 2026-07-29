import { execute, heading, opsClient } from "./client";

async function main() {
heading("Reservas de créditos");
const db = opsClient();
const { data: reservations, error } = await db
  .from("credit_reservations")
  .select("id, user_id, reference_type, reference_id, amount, status, created_at")
  .eq("status", "reserved")
  .order("created_at")
  .limit(500);
if (error) throw error;

const candidates = [];
for (const reservation of reservations ?? []) {
  const table =
    reservation.reference_type === "generation" ? "generations" : "edit_versions";
  const { data: resource } = await db
    .from(table)
    .select("status")
    .eq("id", reservation.reference_id)
    .maybeSingle();
  if (!resource || ["failed", "completed"].includes(resource.status)) {
    candidates.push({ ...reservation, resource_status: resource?.status ?? "missing" });
  }
}
console.table(candidates);

if (execute) {
  for (const reservation of candidates) {
    const { error: releaseError } = await db.rpc(
      "release_reserved_credits_internal",
      { p_user_id: reservation.user_id, p_reservation_id: reservation.id },
    );
    if (releaseError) throw releaseError;
  }
  console.log(`Reservas liberadas: ${candidates.length}`);
}
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Error operativo.");
  process.exitCode = 1;
});
