import type { Metadata } from "next";

import { HqPageHeader, HqStatus, formatDate, shortId } from "@/components/hq/hq-ui";
import { requireHqAdmin } from "@/lib/hq/access";
import { getHqIdentities } from "@/lib/hq/data";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Opiniones" };

export default async function HqFeedbackPage() {
  await requireHqAdmin();
  const admin = createAdminClient();
  const [{ data: feedback }, identities] = await Promise.all([
    admin.from("generation_feedback").select("id,user_id,generation_id,verdict,reasons,comment,created_at,updated_at").order("updated_at", { ascending: false }).limit(100),
    getHqIdentities(),
  ]);
  return <div className="space-y-8">
    <HqPageHeader title="Opiniones" description="El buzón ligado a resultados reales. Aquí aparecen tanto las valoraciones rápidas como los comentarios detallados." />
    <div className="hq-feedback-ledger">
      {(feedback || []).map((item) => <article key={item.id}>
        <div className="hq-feedback-meta"><HqStatus value={item.verdict} /><time>{formatDate(item.updated_at)}</time></div>
        <blockquote>{item.comment || "Valoración rápida sin comentario."}</blockquote>
        {item.reasons.length ? <div className="flex flex-wrap gap-2">{item.reasons.map((reason) => <span className="hq-reason" key={reason}>{reason}</span>)}</div> : null}
        <footer><span>{identities.get(item.user_id)?.email || shortId(item.user_id)}</span><span>Generación {shortId(item.generation_id)}</span></footer>
      </article>)}
    </div>
  </div>;
}
