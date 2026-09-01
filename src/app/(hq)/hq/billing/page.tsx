import type { Metadata } from "next";

import { HqPageHeader, HqStatus, formatDate, shortId } from "@/components/hq/hq-ui";
import { requireHqAdmin } from "@/lib/hq/access";
import { getHqIdentities } from "@/lib/hq/data";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Facturación" };

export default async function HqBillingPage() {
  await requireHqAdmin();
  const admin = createAdminClient();
  const [{ data: subscriptions }, identities] = await Promise.all([
    admin.from("subscriptions").select("id,user_id,plan_key,status,currency,cancel_at_period_end,current_period_end,last_invoice_paid_at,livemode,updated_at").order("updated_at", { ascending: false }).limit(100),
    getHqIdentities(),
  ]);
  return <div className="space-y-8">
    <HqPageHeader title="Facturación" description="La lectura interna de Stripe. El estado mostrado aquí proviene del servidor y nunca de datos enviados por el navegador." />
    <div className="hq-table-wrap"><table className="hq-table"><thead><tr><th>Usuario</th><th>Plan</th><th>Estado</th><th>Renovación</th><th>Último pago</th><th>Cancelación</th><th>Entorno</th></tr></thead><tbody>
      {(subscriptions || []).map((item) => <tr key={item.id}><td><strong>{identities.get(item.user_id)?.name || "Usuario"}</strong><span>{identities.get(item.user_id)?.email || shortId(item.user_id)}</span></td><td className="capitalize">{item.plan_key}</td><td><HqStatus value={item.status} /></td><td>{formatDate(item.current_period_end)}</td><td>{formatDate(item.last_invoice_paid_at)}</td><td>{item.cancel_at_period_end ? <span className="text-amber-200">Al final del periodo</span> : "No"}</td><td>{item.livemode ? "Live" : "Test"}</td></tr>)}
    </tbody></table></div>
  </div>;
}
