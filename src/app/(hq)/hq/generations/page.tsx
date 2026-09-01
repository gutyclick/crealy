import type { Metadata } from "next";

import { HqPageHeader, HqStatus, formatDate, shortId } from "@/components/hq/hq-ui";
import { requireHqAdmin } from "@/lib/hq/access";
import { getHqIdentities } from "@/lib/hq/data";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Generaciones" };

export default async function HqGenerationsPage() {
  await requireHqAdmin();
  const admin = createAdminClient();
  const [{ data: generations }, identities] = await Promise.all([
    admin.from("generations").select("id,user_id,status,content_type,requested_format,quality,credit_cost,error_code,created_at,completed_at").order("created_at", { ascending: false }).limit(100),
    getHqIdentities(),
  ]);
  return <div className="space-y-8">
    <HqPageHeader title="Generaciones" description="Resultados recientes, coste en créditos y causa técnica cuando una solicitud no termina correctamente." />
    <div className="hq-table-wrap"><table className="hq-table"><thead><tr><th>ID</th><th>Usuario</th><th>Formato</th><th>Calidad</th><th>Créditos</th><th>Estado</th><th>Error</th><th>Creada</th></tr></thead><tbody>
      {(generations || []).map((item) => <tr key={item.id}>
        <td className="font-mono text-xs text-white/66">{shortId(item.id)}</td><td><strong>{identities.get(item.user_id)?.name || "Usuario"}</strong><span>{identities.get(item.user_id)?.email || shortId(item.user_id)}</span></td>
        <td>{item.requested_format}<span>{item.content_type}</span></td><td className="capitalize">{item.quality}</td><td>{item.credit_cost ?? "—"}</td><td><HqStatus value={item.status} /></td><td className="max-w-52"><span className="line-clamp-2 text-[0.72rem] text-red-200/75">{item.error_code || "—"}</span></td><td>{formatDate(item.created_at)}</td>
      </tr>)}
    </tbody></table></div>
  </div>;
}
