import { execute, heading, opsClient } from "./client";

async function main() {
heading("Storage privado");
const db = opsClient();
const { data: users, error: usersError } = await db
  .from("user_uploads")
  .select("user_id")
  .limit(500);
if (usersError) throw usersError;

const userIds = [...new Set((users ?? []).map((row) => row.user_id))];
const orphanPaths: string[] = [];
for (const userId of userIds) {
  const { data: files } = await db.storage
    .from("generations")
    .list(`${userId}/uploads`, { limit: 500 });
  for (const file of files ?? []) {
    const path = `${userId}/uploads/${file.name}`;
    const { count } = await db
      .from("user_uploads")
      .select("id", { count: "exact", head: true })
      .eq("storage_path", path);
    if (!count) orphanPaths.push(path);
  }
}
console.table(orphanPaths.map((path) => ({ orphan_path: path })));

if (execute && orphanPaths.length) {
  const { error } = await db.storage.from("generations").remove(orphanPaths);
  if (error) throw error;
  console.log(`Archivos huérfanos eliminados: ${orphanPaths.length}`);
}
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Error operativo.");
  process.exitCode = 1;
});
