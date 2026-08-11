export class BillingError extends Error {
  constructor(
    public readonly code:
      | "billing_disabled"
      | "invalid_plan"
      | "consent_required"
      | "billing_customer_missing"
      | "subscription_already_exists"
      | "checkout_creation_failed"
      | "portal_creation_failed"
      | "subscription_sync_failed"
      | "credit_grant_failed",
    public readonly status: number,
    public readonly userMessage: string,
  ) {
    super(code);
  }
}
