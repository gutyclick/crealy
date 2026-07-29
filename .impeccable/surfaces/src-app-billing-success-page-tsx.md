---
version: 1
slug: "src-app-billing-success-page-tsx"
primary_target: "src/app/billing/success/page.tsx"
related_targets: []
---

Intent: Reassure an authenticated customer while signed webhook state catches up, then guide them to create or inspect billing.
Primary action: Go to Create once Pro is active; secondary action opens Billing.
Hierarchy: Centered status mark, plain-language synchronization message, live plan/credit line, two actions.
Visual world: Minimal Crealy confirmation on matte black with one lime readiness signal and no confetti or fabricated receipt.
Truth constraints: Success is only declared after /api/billing/status reports paid access; query session id is never treated as proof.
States: Synchronizing, active, delayed/error recovery, reduced motion.
Motion: Subtle status pulse during synchronization that stops on completion and respects reduced motion.
Responsive: Fits one viewport on mobile without overflow.
