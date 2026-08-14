# Runbook: Stripe y webhooks

1. Ejecutar `npm run ops:billing`.
2. Revisar eventos `failed` o `processing` y el delivery en Stripe.
3. Confirmar `STRIPE_WEBHOOK_SECRET`, modo live/test y Price IDs.
4. Reenviar el evento desde Stripe; `stripe_events` evita doble procesamiento.
5. No crear suscripciones ni grants manuales antes de reconciliar el invoice.

## Recuperación segura para el usuario

- Al volver de Checkout, `/billing/success` llama una sola vez a
  `/api/billing/reconcile` con el `session_id` firmado por Stripe.
- La reconciliación exige que `client_reference_id` y
  `metadata.supabase_user_id` coincidan con la sesión autenticada.
- Si el usuario cerró la pantalla, Facturación ofrece “Ya pagué · actualizar
  plan”. Solo recupera clientes creados por Crealy cuyo metadata coincide con
  ese usuario.
- La acreditación usa el ID de la factura como clave idempotente; reintentar no
  duplica créditos.

Esta recuperación cubre retrasos puntuales. Las renovaciones siguen dependiendo
del webhook, por lo que el endpoint de Stripe debe permanecer activo y sus
entregas fallidas deben reenviarse.

Desactivar `STRIPE_BILLING_ENABLED` si Checkout funciona pero los webhooks no se procesan.
