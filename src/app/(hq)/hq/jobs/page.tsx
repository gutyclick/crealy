import type { Metadata } from "next";

import { HqEmptyRow, HqPageHeader, HqStatus, HqTableRegion, formatDate, shortId } from "@/components/hq/hq-ui";
import { requireHqAdmin } from "@/lib/hq/access";
import { getHqIdentities } from "@/lib/hq/data";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Cola" };

export default async function HqJobsPage() {
  await requireHqAdmin();
  const admin = createAdminClient();
  const [jobsResult, identities] = await Promise.all([
    admin.from("jobs").select("id,user_id,job_type,status,resource_id,attempt_count,max_attempts,error_code,estimated_cost_usd,created_at,started_at,completed_at").order("created_at", { ascending: false }).limit(100),
    getHqIdentities(),
  ]);
  if (jobsResult.error) throw new Error("hq_jobs_unavailable");
  const jobs = jobsResult.data;
  return <div className="space-y-8">
    <HqPageHeader title="Cola de trabajo" description="Los 100 trabajos más recientes de Trigger.dev y del sistema durable: intentos, errores y tiempo de cada operación." />
    <HqTableRegion label="Trabajos más recientes"><table className="hq-table"><thead><tr><th scope="col">Trabajo</th><th scope="col">Usuario</th><th scope="col">Tipo</th><th scope="col">Estado</th><th scope="col">Intentos</th><th scope="col">Error</th><th scope="col">Coste est.</th><th scope="col">Creado</th></tr></thead><tbody>
      {(jobs || []).map((job) => <tr key={job.id}><td className="font-mono text-xs text-white/66">{shortId(job.id)}</td><td>{job.user_id ? <><strong>{identities.get(job.user_id)?.name || "Usuario"}</strong><span>{identities.get(job.user_id)?.email || shortId(job.user_id)}</span></> : <span>Sistema</span>}</td><td>{job.job_type}</td><td><HqStatus value={job.status} /></td><td>{job.attempt_count}/{job.max_attempts}</td><td className="max-w-52"><span className="line-clamp-2 text-[0.72rem] text-red-200/75">{job.error_code || "—"}</span></td><td>{job.estimated_cost_usd == null ? "—" : `$${job.estimated_cost_usd.toFixed(4)}`}</td><td>{formatDate(job.created_at)}</td></tr>)}{!jobs?.length ? <HqEmptyRow columns={8} message="La cola todavía no tiene trabajos para mostrar." /> : null}
    </tbody></table></HqTableRegion>
  </div>;
}
