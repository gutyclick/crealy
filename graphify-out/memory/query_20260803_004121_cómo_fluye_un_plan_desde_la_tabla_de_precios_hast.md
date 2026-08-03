---
type: "query"
date: "2026-08-03T00:41:21.566965+00:00"
question: "¿Cómo fluye un plan desde la tabla de precios hasta Stripe, créditos y Firma visual?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["PricingTableClient()", "CheckoutButton()", "getStripePriceId()", "processStripeEvent()", "handleInvoicePaid()", "getUserBillingState()", "BRAND_STYLE_ENTITLEMENTS"]
---

# Q: ¿Cómo fluye un plan desde la tabla de precios hasta Stripe, créditos y Firma visual?

## Answer

Expanded from graph vocabulary: pricing, plans, checkout, stripe, billing, credits, entitlement, brand, style. PricingTableClient reads PRICING_PLANS and renders CheckoutButton. CheckoutButton reaches the billing checkout POST route, which calls getStripePriceId and internalPlanKey before Stripe. Stripe webhook POST calls processStripeEvent; invoice payment calls syncStripeSubscription and getCreditServerEnv, then persists billing credit effects through the database layer. getUserBillingState calculates EffectivePlan and getBrandStyleAccess consumes that state to resolve BRAND_STYLE_ENTITLEMENTS, enabling Firma visual only for eligible tiers.

## Outcome

- Signal: useful

## Source Nodes

- PricingTableClient()
- CheckoutButton()
- getStripePriceId()
- processStripeEvent()
- handleInvoicePaid()
- getUserBillingState()
- BRAND_STYLE_ENTITLEMENTS