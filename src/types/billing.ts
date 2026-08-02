export type PlanKey = "free" | "starter" | "pro" | "business";

export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export type EffectivePlan = {
  key: PlanKey;
  hasPaidAccess: boolean;
  renewsAt: Date | null;
  endsAt: Date | null;
  isPastDue: boolean;
};

export type CreditTransactionView = {
  id: string;
  type:
    | "grant"
    | "reserve"
    | "consume"
    | "release"
    | "expire"
    | "refund"
    | "adjustment";
  amount: number;
  balanceAfter: number | null;
  description: string;
  createdAt: string;
};

export type UserBillingState = {
  effectivePlan: EffectivePlan;
  subscription: {
    status: SubscriptionStatus;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
  } | null;
  credits: {
    available: number;
    reserved: number;
    lifetimeGranted: number;
    lifetimeConsumed: number;
  };
  recentTransactions: CreditTransactionView[];
  billingEnabled: boolean;
  canCheckoutPro: boolean;
  hasBillingCustomer: boolean;
};

export type CreditReservationResult = {
  reservationId: string;
  amount: number;
  creditsRemaining: number;
  isExisting: boolean;
};

export type CreditConsumptionResult = {
  transactionId: string;
  amount: number;
  creditsRemaining: number;
};
