import type { SubscriptionStatus } from "@/types/billing";

const MANAGEABLE_SUBSCRIPTION_STATUSES = new Set<SubscriptionStatus>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
]);

export function isManageableSubscriptionStatus(
  status: string | null | undefined,
) {
  return MANAGEABLE_SUBSCRIPTION_STATUSES.has(status as SubscriptionStatus);
}

export const MANAGEABLE_SUBSCRIPTION_STATUS_LIST = [
  ...MANAGEABLE_SUBSCRIPTION_STATUSES,
];
