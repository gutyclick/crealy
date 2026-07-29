# Runbook: Stripe y webhooks

1. Ejecutar `npm run ops:billing`.
2. Revisar eventos `failed` o `processing` y el delivery en Stripe.
3. Confirmar `STRIPE_WEBHOOK_SECRET`, modo live/test y Price IDs.
4. Reenviar el evento desde Stripe; `stripe_events` evita doble procesamiento.
5. No crear suscripciones ni grants manuales antes de reconciliar el invoice.

Desactivar `STRIPE_BILLING_ENABLED` si Checkout funciona pero los webhooks no se procesan.
