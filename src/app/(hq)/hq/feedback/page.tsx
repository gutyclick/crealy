import type { Metadata } from "next";

import { HqPageHeader, HqStatus, formatDate, shortId } from "@/components/hq/hq-ui";
import { requireHqAdmin } from "@/lib/hq/access";
import { getHqIdentities } from "@/lib/hq/data";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Opiniones" };

export default async function HqFeedbackPage() {
  await requireHqAdmin();
  const admin = createAdminClient();
  const [feedbackResult, identities] = await Promise.all([
    admin.from("generation_feedback").select("id,user_id,generation_id,verdict,reasons,comment,created_at,updated_at").order("updated_at", { ascending: false }).limit(100),
    getHqIdentities(),
  ]);
  if (feedbackResult.error) throw new Error("hq_feedback_unavailable");
  const feedback = feedbackResult.data;
  return <div className="space-y-8">
    <HqPageHeader title="Opiniones" description="Las 100 opiniones más recientes ligadas a resultados reales, incluidas valoraciones rápidas y comentarios detallados." />
    <div className="hq-feedback-ledger">
      {(feedback || []).map((item) => <article key={item.id}>
        <div className="hq-feedback-meta"><HqStatus value={item.verdict} /><time>{formatDate(item.updated_at)}</time></div>
        <blockquote>{item.comment || "Valoración rápida sin comentario."}</blockquote>
        {item.reasons.length ? <div className="flex flex-wrap gap-2">{item.reasons.map((reason) => <span className="hq-reason" key={reason}>{reason}</span>)}</div> : null}
        <footer><span>{identities.get(item.user_id)?.email || shortId(item.user_id)}</span><span>Generación {shortId(item.generation_id)}</span></footer>
      </article>)}
      {!feedback?.length ? <div className="hq-empty-row col-span-full">Todavía no hay opiniones para mostrar.</div> : null}
    </div>
  </div>;
}
