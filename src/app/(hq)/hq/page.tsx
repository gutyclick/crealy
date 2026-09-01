import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleAlert, MessageSquareText } from "lucide-react";

import { HqMetric, HqPageHeader, HqStatus, formatDate, shortId } from "@/components/hq/hq-ui";
import { requireHqAdmin } from "@/lib/hq/access";
import { getHqIdentities, getHqOverview } from "@/lib/hq/data";

export const metadata: Metadata = { title: "Resumen" };

export default async function HqOverviewPage() {
  await requireHqAdmin();
  const [overview, identities] = await Promise.all([getHqOverview(), getHqIdentities()]);
  const { metrics } = overview;
  return (
    <div className="space-y-9">
      <HqPageHeader
        title="El pulso de Crealy, sin ruido."
        description="Una lectura operativa de los últimos siete días. Empieza por las excepciones; lo saludable puede seguir trabajando solo."
        aside={<p className="font-mono text-xs text-white/42">Actualizado {formatDate(new Date().toISOString())}</p>}
      />

      <section aria-label="Métricas principales" className="hq-metric-grid">
        <HqMetric label="Usuarios" value={metrics.users} detail={`+${metrics.newUsers} durante los últimos 7 días`} />
        <HqMetric label="Generaciones · 7 días" value={metrics.generations} detail={`${metrics.failed} terminaron con error`} tone={metrics.failed ? "warning" : "good"} />
        <HqMetric label="Tasa de éxito" value={`${metrics.successRate}%`} detail="Resultados completados sobre solicitudes" tone={metrics.successRate >= 90 ? "good" : "warning"} />
        <HqMetric label="Suscripciones activas" value={metrics.subscriptions} detail="Incluye periodo de gracia y prueba" />
      </section>

      {(metrics.failedJobs > 0 || metrics.activeJobs > 0) && (
        <section className="hq-attention" aria-label="Atención operativa">
          <CircleAlert aria-hidden="true" className="size-5" />
          <div><strong>La cola requiere una mirada.</strong><p>{metrics.activeJobs} trabajos activos y {metrics.failedJobs} fallidos durante las últimas 24 horas.</p></div>
          <Link href="/hq/jobs">Revisar cola <ArrowRight className="size-4" /></Link>
        </section>
      )}

      <div className="grid gap-8 xl:grid-cols-[1.35fr_.85fr]">
        <section>
          <div className="hq-section-heading"><div><h2>Actividad de creación</h2><p>Últimas solicitudes recibidas por el sistema.</p></div><Link href="/hq/generations">Ver todas</Link></div>
          <div className="hq-table-wrap">
            <table className="hq-table">
              <thead><tr><th>Resultado</th><th>Usuario</th><th>Formato</th><th>Estado</th><th>Hora</th></tr></thead>
              <tbody>{overview.recentGenerations.map((item) => {
                const identity = identities.get(item.user_id);
                return <tr key={item.id}><td className="font-mono text-xs text-white/66">{shortId(item.id)}</td><td><strong>{identity?.name || "Usuario"}</strong><span>{identity?.email || shortId(item.user_id)}</span></td><td>{item.requested_format}</td><td><HqStatus value={item.status} /></td><td>{formatDate(item.created_at)}</td></tr>;
              })}</tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="hq-section-heading"><div><h2>Voz del producto</h2><p>{metrics.feedback} opiniones durante los últimos 7 días.</p></div><Link href="/hq/feedback">Abrir buzón</Link></div>
          <div className="hq-feedback-stream">
            {overview.recentFeedback.length ? overview.recentFeedback.map((item) => (
              <article key={item.id}>
                <div className="flex items-center justify-between gap-3"><HqStatus value={item.verdict} /><time>{formatDate(item.updated_at)}</time></div>
                <p>{item.comment || (item.reasons.length ? `Motivos: ${item.reasons.join(", ")}` : "Valoración rápida sin comentario.")}</p>
                <span>{identities.get(item.user_id)?.email || shortId(item.user_id)}</span>
              </article>
            )) : <div className="hq-empty"><MessageSquareText className="size-5" /><p>Aún no hay opiniones en este periodo.</p></div>}
          </div>
        </section>
      </div>
    </div>
  );
}
