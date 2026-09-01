import type { Metadata } from "next";

import { HqEmptyRow, HqPageHeader, HqStatus, HqTableRegion, formatDate, shortId } from "@/components/hq/hq-ui";
import { requireHqAdmin } from "@/lib/hq/access";
import { getHqIdentities } from "@/lib/hq/data";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Generaciones" };

export default async function HqGenerationsPage() {
  await requireHqAdmin();
  const admin = createAdminClient();
  const [generationsResult, identities] = await Promise.all([
    admin.from("generations").select("id,user_id,status,content_type,requested_format,quality,credit_cost,error_code,created_at,completed_at").order("created_at", { ascending: false }).limit(100),
    getHqIdentities(),
  ]);
  if (generationsResult.error) throw new Error("hq_generations_unavailable");
  const generations = generationsResult.data;
  return <div className="space-y-8">
    <HqPageHeader title="Generaciones" description="Las 100 solicitudes más recientes, su coste en créditos y causa técnica cuando una no termina correctamente." />
    <HqTableRegion label="Generaciones más recientes"><table className="hq-table"><thead><tr><th scope="col">ID</th><th scope="col">Usuario</th><th scope="col">Formato</th><th scope="col">Calidad</th><th scope="col">Créditos</th><th scope="col">Estado</th><th scope="col">Error</th><th scope="col">Creada</th></tr></thead><tbody>
      {(generations || []).map((item) => <tr key={item.id}>
        <td className="font-mono text-xs text-white/66">{shortId(item.id)}</td><td><strong>{identities.get(item.user_id)?.name || "Usuario"}</strong><span>{identities.get(item.user_id)?.email || shortId(item.user_id)}</span></td>
        <td>{item.requested_format}<span>{item.content_type}</span></td><td className="capitalize">{item.quality}</td><td>{item.credit_cost ?? "—"}</td><td><HqStatus value={item.status} /></td><td className="max-w-52"><span className="line-clamp-2 text-[0.72rem] text-red-200/75">{item.error_code || "—"}</span></td><td>{formatDate(item.created_at)}</td>
      </tr>)}{!generations?.length ? <HqEmptyRow columns={8} message="Todavía no hay generaciones para mostrar." /> : null}
    </tbody></table></HqTableRegion>
  </div>;
}
