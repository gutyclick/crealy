---
version: 1
slug: "src-app-pricing-page-tsx"
primary_target: "src/app/pricing/page.tsx"
related_targets: []
---

Intent: Persuade a creators and small teams to choose a truthful monthly plan, with no invented discount, trial, annual billing, or testimonial.
Primary action: Start with Free or open secure Stripe Checkout for Pro.
Hierarchy: Centered pricing thesis; a quiet credit-cost strip; two asymmetric plan columns with Pro as the single lime action; concise operational FAQ.
Visual world: Crealy production table — matte warm blacks, editorial spacing, lime #DDF527 only for readiness/action, Geist hierarchy, no decorative glass or gradients.
Truth constraints: Free includes configured one-time welcome credits. Pro includes configured monthly credits. Displayed Pro price comes only from STRIPE_PRO_PRICE_DISPLAY. Business remains hidden unless enabled with a real price.
States: Logged out CTA routes to signup/login; logged in checkout shows loading/error; disabled billing communicates unavailability; checkout cancellation is visible but calm.
Motion: One short clipped plan reveal and restrained hover lift; content remains visible and reduced-motion safe.
Responsive: 320px minimum, single column on mobile, no horizontal scrolling, controls at least 44px.
