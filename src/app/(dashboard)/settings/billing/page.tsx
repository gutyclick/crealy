import type { Metadata } from "next";
import { AlertCircle, ArrowRight, Coins } from "lucide-react";

import { PortalButton } from "@/components/billing/portal-button";
import { PricingTable } from "@/components/billing/pricing-table";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { getUserBillingState } from "@/lib/billing/get-user-billing-state";
import { requireUser } from "@/lib/auth/require-user";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Facturación | Crealy",
};

const planNames = {
  free: "Gratis",
  starter: "Starter",
  pro: "Creator",
  business: "Pro",
} as const;

const subscriptionStatusNames: Record<string, string> = {
  active: "Activo",
  trialing: "Prueba activa",
  past_due: "Pago pendiente",
  canceled: "Cancelado",
  unpaid: "Pago vencido",
  paused: "Pausado",
  incomplete: "Configuración pendiente",
  incomplete_expired: "Configuración vencida",
  free: "Gratis",
};

const transactionLabels = {
  grant: "Créditos recibidos",
  consume: "Créditos utilizados",
  expire: "Créditos vencidos",
  refund: "Créditos devueltos",
  adjustment: "Ajuste de créditos",
  reserve: "Reserva",
  release: "Liberación",
} as const;

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function BillingPage() {
  const user = await requireUser("/settings/billing");
  const state = await getUserBillingState(user.id);
  const periodLabel = state.effectivePlan.endsAt
    ? `Finaliza el ${formatDate(state.subscription?.currentPeriodEnd ?? null)}`
    : state.effectivePlan.renewsAt
      ? `Renueva el ${formatDate(state.subscription?.currentPeriodEnd ?? null)}`
      : "Sin renovación automática";

  return (
    <main className="py-12 sm:py-16">
      <Container>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-medium text-brand">Tu cuenta</p>
            <h1 className="mt-3 text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Plan y créditos, sin letra pequeña.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted">
              Consulta lo disponible, revisa cada movimiento y administra el
              cobro directamente en Stripe.
            </p>
          </div>

          {state.effectivePlan.isPastDue && (
            <div className="mt-10 flex items-start gap-3 rounded-xl border border-amber-300/25 bg-amber-300/[0.06] p-4 text-amber-100">
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0"
              />
              <p className="text-sm leading-6">
                Stripe no pudo completar el último pago. Actualiza tu método
                de pago para evitar que el plan vuelva a Gratis.
              </p>
            </div>
          )}

          <section className="mt-10 grid overflow-hidden rounded-2xl border border-white/10 bg-surface md:grid-cols-2">
            <div className="p-7 sm:p-9">
              <p className="text-sm text-muted">Créditos disponibles</p>
              <div className="mt-4 flex items-center gap-4">
                <Coins aria-hidden="true" className="size-7 text-brand" />
                <strong className="text-6xl font-semibold tracking-[-0.04em] text-brand">
                  {state.credits.available}
                </strong>
              </div>
              {state.credits.reserved > 0 && (
                <p className="mt-4 text-sm text-muted">
                  {state.credits.reserved} reservados por una operación en
                  curso.
                </p>
              )}
              <Button href="/create" className="mt-8" size="lg">
                Usar créditos
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            </div>

            <div className="border-t border-white/10 p-7 sm:p-9 md:border-l md:border-t-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted">Plan actual</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">
                    {planNames[state.effectivePlan.key]}
                  </h2>
                </div>
                <span className="rounded-full border border-white/12 px-3 py-1 font-mono text-xs text-white/65">
                  {subscriptionStatusNames[
                    state.subscription?.status ?? "free"
                  ] ?? "En actualización"}
                </span>
              </div>
              <p className="mt-5 text-sm text-muted">{periodLabel}</p>
              <div className="mt-8">
                {state.hasBillingCustomer ? (
                  <PortalButton />
                ) : state.canCheckoutPro ? (
                  <Button href="/pricing" variant="secondary" size="lg">
                    Ver plan Pro
                  </Button>
                ) : (
                  <p className="text-sm leading-6 text-muted">
                    Los pagos todavía no están disponibles. Tus créditos
                    actuales siguen funcionando.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="mt-16">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-brand">Movimientos</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  Historial de créditos
                </h2>
              </div>
              <p className="hidden text-sm text-muted sm:block">
                Últimos 25 movimientos
              </p>
            </div>

            {state.recentTransactions.length ? (
              <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
                {state.recentTransactions.map((transaction) => {
                  const positive = transaction.amount > 0;
                  return (
                    <div
                      key={transaction.id}
                      className="grid grid-cols-[1fr_auto] items-center gap-4 py-4 sm:grid-cols-[1.2fr_0.8fr_auto]"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {transaction.description ||
                            transactionLabels[transaction.type]}
                        </p>
                        <p className="mt-1 font-mono text-xs text-white/50">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                      <p className="hidden text-right text-sm text-muted sm:block">
                        Saldo {transaction.balanceAfter ?? "—"}
                      </p>
                      <p
                        className={cn(
                          "font-mono text-sm font-semibold",
                          positive ? "text-brand" : "text-foreground",
                        )}
                      >
                        {positive ? "+" : ""}
                        {transaction.amount}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 border-y border-white/10 py-10 text-center">
                <p className="text-sm text-muted">
                  Tus primeros movimientos aparecerán aquí.
                </p>
              </div>
            )}
          </section>

          {state.effectivePlan.key === "free" && state.canCheckoutPro && (
            <section className="mt-20 border-t border-white/10 pt-16 text-center">
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.035em]">
                ¿Necesitas un saldo nuevo cada mes?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted">
                Pro añade créditos en cada ciclo confirmado por Stripe.
              </p>
              <div className="mt-9">
                <PricingTable
                  authenticated
                  currentPlan={state.effectivePlan.key}
                  compact
                />
              </div>
            </section>
          )}
        </div>
      </Container>
    </main>
  );
}
