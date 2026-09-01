import type { Metadata } from "next";

import { HqEmptyRow, HqPageHeader, HqStatus, HqTableRegion, formatDate, shortId } from "@/components/hq/hq-ui";
import { requireHqAdmin } from "@/lib/hq/access";
import { getHqIdentities } from "@/lib/hq/data";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Usuarios" };

export default async function HqUsersPage() {
  await requireHqAdmin();
  const admin = createAdminClient();
  const [profilesResult, identities] = await Promise.all([
    admin.from("profiles").select("id,full_name,created_at").order("created_at", { ascending: false }).limit(100),
    getHqIdentities(),
  ]);
  if (profilesResult.error) throw new Error("hq_users_unavailable");
  const profiles = profilesResult.data;
  const ids = (profiles || []).map((profile) => profile.id);
  const [subscriptionsResult, creditsResult] = ids.length
    ? await Promise.all([
        admin.from("subscriptions").select("user_id,plan_key,status,current_period_end").in("user_id", ids).order("updated_at", { ascending: false }),
        admin.from("credit_accounts").select("user_id,available_balance,reserved_balance,lifetime_consumed").in("user_id", ids),
      ])
    : [{ data: [] }, { data: [] }];
  if ("error" in subscriptionsResult && subscriptionsResult.error) throw new Error("hq_subscriptions_unavailable");
  if ("error" in creditsResult && creditsResult.error) throw new Error("hq_credits_unavailable");
  const subscriptions = subscriptionsResult.data;
  const credits = creditsResult.data;
  const subscriptionByUser = new Map((subscriptions || []).map((item) => [item.user_id, item]));
  const creditsByUser = new Map((credits || []).map((item) => [item.user_id, item]));

  return <div className="space-y-8">
    <HqPageHeader title="Usuarios" description="Las 100 cuentas más recientes, su acceso, plan y consumo. Los cambios administrativos llegarán en una fase controlada y auditada." />
    <HqTableRegion label="Cuentas más recientes"><table className="hq-table"><thead><tr><th scope="col">Usuario</th><th scope="col">Plan</th><th scope="col">Créditos</th><th scope="col">Consumidos</th><th scope="col">Último acceso</th><th scope="col">Registro</th></tr></thead><tbody>
      {(profiles || []).map((profile) => {
        const identity = identities.get(profile.id);
        const subscription = subscriptionByUser.get(profile.id);
        const account = creditsByUser.get(profile.id);
        return <tr key={profile.id}>
          <td><strong>{profile.full_name || identity?.name || "Usuario"}</strong><span>{identity?.email || shortId(profile.id)}</span></td>
          <td>{subscription ? <div className="flex flex-wrap items-center gap-2"><span className="capitalize">{subscription.plan_key}</span><HqStatus value={subscription.status} /></div> : <span className="text-white/48">Gratis</span>}</td>
          <td>{account?.available_balance ?? 0}<span>{account?.reserved_balance ? `${account.reserved_balance} reservados` : "Disponibles"}</span></td>
          <td>{account?.lifetime_consumed ?? 0}</td>
          <td>{formatDate(identity?.lastSignInAt || null)}</td><td>{formatDate(profile.created_at)}</td>
        </tr>;
      })}{!profiles?.length ? <HqEmptyRow columns={6} message="Todavía no hay usuarios para mostrar." /> : null}
    </tbody></table></HqTableRegion>
  </div>;
}
