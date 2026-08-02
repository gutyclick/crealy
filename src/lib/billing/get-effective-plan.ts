import type {
  EffectivePlan,
  PlanKey,
  SubscriptionStatus,
} from "@/types/billing";

type SubscriptionLike = {
  plan_key: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export function getEffectivePlan(
  subscription: SubscriptionLike | null,
  gracePeriodDays: number,
  now = new Date(),
): EffectivePlan {
  if (!subscription) {
    return {
      key: "free",
      hasPaidAccess: false,
      renewsAt: null,
      endsAt: null,
      isPastDue: false,
    };
  }

  const status = subscription.status as SubscriptionStatus;
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const periodIsCurrent = Boolean(periodEnd && periodEnd > now);
  const graceEnd = periodEnd
    ? new Date(periodEnd.getTime() + gracePeriodDays * 86_400_000)
    : null;
  const isPastDue = status === "past_due";
  const paidStatus =
    (status === "active" || status === "trialing") && periodIsCurrent;
  const inGrace =
    isPastDue && Boolean(graceEnd && graceEnd > now);
  const hasPaidAccess = paidStatus || inGrace;
  const key: PlanKey =
    hasPaidAccess &&
    (subscription.plan_key === "starter" ||
      subscription.plan_key === "pro" ||
      subscription.plan_key === "business")
      ? subscription.plan_key
      : "free";

  return {
    key,
    hasPaidAccess,
    renewsAt:
      hasPaidAccess && !subscription.cancel_at_period_end ? periodEnd : null,
    endsAt:
      subscription.cancel_at_period_end || status === "canceled"
        ? periodEnd
        : null,
    isPastDue,
  };
}
