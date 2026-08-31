import type { Metadata } from "next";
import { AlertCircle, ArrowRight, Coins } from "lucide-react";

import { PortalButton } from "@/components/billing/portal-button";
import { BillingSyncButton } from "@/components/billing/billing-sync-button";
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
        <div className="mx-auto max-w-7xl">
          <header className="max-w-3xl">
            <h1 className="text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Plan y facturación
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              Revisa tus créditos, elige cuánto quieres crear y administra tus
              pagos de forma segura en Stripe.
            </p>
          </header>

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

          <section className="mt-8 rounded-2xl border border-white/10 bg-surface p-5 sm:p-7 lg:grid lg:grid-cols-[1fr_17rem] lg:items-center lg:gap-8">
            <div className="grid gap-6 sm:grid-cols-2 sm:gap-0">
              <div className="sm:border-r sm:border-white/10 sm:pr-7">
                <p className="text-sm text-muted">Plan actual</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-semibold tracking-[-0.035em]">
                    {planNames[state.effectivePlan.key]}
                  </h2>
                  <span className="rounded-full border border-white/12 px-3 py-1 font-mono text-xs text-white/65">
                    {subscriptionStatusNames[
                      state.subscription?.status ?? "free"
                    ] ?? "En actualización"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">{periodLabel}</p>
              </div>

              <div className="border-t border-white/10 pt-5 sm:border-t-0 sm:pl-7 sm:pt-0">
                <p className="text-sm text-muted">Créditos disponibles</p>
                <div className="mt-2 flex items-center gap-3">
                  <Coins aria-hidden="true" className="size-5 text-brand" />
                  <strong className="text-4xl font-semibold tracking-[-0.04em] text-brand">
                    {state.credits.available}
                  </strong>
                </div>
                {state.credits.reserved > 0 ? (
                  <p className="mt-2 text-sm text-muted">
                    {state.credits.reserved} reservados por un trabajo en curso.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-7 grid gap-3 border-t border-white/10 pt-6 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <Button href="/create" size="lg" className="w-full">
                Crear un diseño
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
              {state.hasManageableSubscription ? (
                <PortalButton label="Administrar plan" />
              ) : state.canCheckoutPro ? (
                <>
                  <Button href="#planes" variant="secondary" size="lg" className="w-full">
                    Comparar planes
                  </Button>
                  <BillingSyncButton />
                </>
              ) : (
                <p className="text-sm leading-6 text-muted">
                  Los pagos todavía no están disponibles. Tus créditos actuales
                  siguen funcionando.
                </p>
              )}
            </div>
          </section>

          {state.effectivePlan.key === "free" && state.canCheckoutPro && (
            <section id="planes" className="mt-12 scroll-mt-24 border-y border-white/10 py-10 sm:mt-16 sm:py-14">
              <div className="mx-auto mb-8 max-w-2xl text-center">
                <h2 className="text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                  Elige cuánto quieres crear
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
                  Los tres planes incluyen todas las herramientas. Solo cambia
                  la cantidad de créditos y la prioridad.
                </p>
              </div>
              <PricingTable
                authenticated
                currentPlan={state.effectivePlan.key}
                compact
              />
            </section>
          )}

          <section className="mt-14 sm:mt-16">
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

        </div>
      </Container>
    </main>
  );
}
