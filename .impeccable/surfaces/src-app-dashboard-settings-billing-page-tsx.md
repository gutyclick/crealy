---
version: 1
slug: "src-app-dashboard-settings-billing-page-tsx"
primary_target: "src/app/(dashboard)/settings/billing/page.tsx"
related_targets: []
---

Intent: Let an authenticated user understand plan, credit balance, renewal/cancellation state, and recent credit movements in seconds.
Primary action: Manage the existing subscription in Stripe Portal, or upgrade to Pro when eligible.
Hierarchy: Centered account thesis and credit balance; plan status beside credit usage; recent movements as a readable ledger, not nested cards.
Visual world: Crealy production table — dark matte surface, precise dividers, lime only for available balance/action, operational Geist Mono only for dates and signed amounts.
Truth constraints: Values come from Supabase/Stripe state. No mock price, trial, annual offer, fake invoice, or fabricated usage.
States: Active, cancel-at-period-end, past due, free/no customer, portal loading/error, empty transaction history.
Motion: Brief count/status reveal only; no distracting continuous motion.
Responsive: Single-column mobile flow, compact ledger rows, clear keyboard focus and 44px actions.
