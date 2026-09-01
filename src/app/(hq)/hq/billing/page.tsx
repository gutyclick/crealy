import type { Metadata } from "next";

import { HqEmptyRow, HqPageHeader, HqStatus, HqTableRegion, formatDate, shortId } from "@/components/hq/hq-ui";
import { requireHqAdmin } from "@/lib/hq/access";
import { getHqIdentities } from "@/lib/hq/data";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Facturación" };

export default async function HqBillingPage() {
  await requireHqAdmin();
  const admin = createAdminClient();
  const [subscriptionsResult, identities] = await Promise.all([
    admin.from("subscriptions").select("id,user_id,plan_key,status,currency,cancel_at_period_end,current_period_end,last_invoice_paid_at,livemode,updated_at").order("updated_at", { ascending: false }).limit(100),
    getHqIdentities(),
  ]);
  if (subscriptionsResult.error) throw new Error("hq_billing_unavailable");
  const subscriptions = subscriptionsResult.data;
  return <div className="space-y-8">
    <HqPageHeader title="Facturación" description="Las 100 suscripciones más recientes según Stripe. El estado proviene del servidor y nunca de datos enviados por el navegador." />
    <HqTableRegion label="Suscripciones más recientes"><table className="hq-table"><thead><tr><th scope="col">Usuario</th><th scope="col">Plan</th><th scope="col">Estado</th><th scope="col">Renovación</th><th scope="col">Último pago</th><th scope="col">Cancelación</th><th scope="col">Entorno</th></tr></thead><tbody>
      {(subscriptions || []).map((item) => <tr key={item.id}><td><strong>{identities.get(item.user_id)?.name || "Usuario"}</strong><span>{identities.get(item.user_id)?.email || shortId(item.user_id)}</span></td><td className="capitalize">{item.plan_key}</td><td><HqStatus value={item.status} /></td><td>{formatDate(item.current_period_end)}</td><td>{formatDate(item.last_invoice_paid_at)}</td><td>{item.cancel_at_period_end ? <span className="text-amber-200">Al final del periodo</span> : "No"}</td><td>{item.livemode ? "Live" : "Test"}</td></tr>)}{!subscriptions?.length ? <HqEmptyRow columns={7} message="Todavía no hay suscripciones para mostrar." /> : null}
    </tbody></table></HqTableRegion>
  </div>;
}
