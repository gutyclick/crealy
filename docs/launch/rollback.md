# Rollback

1. Detén el impacto con flags: `OPENAI_GENERATION_ENABLED=false`,
   `OPENAI_EDITING_ENABLED=false`, `STRIPE_BILLING_ENABLED=false` o
   `TRANSACTIONAL_EMAILS_ENABLED=false`.
2. Conserva logs, IDs de job/evento y hora. Nunca copies prompts, imágenes,
   tokens ni secretos al ticket.
3. En Vercel, promociona el último deployment verificado. No reviertas una
   migración aplicada ni borres datos.
4. Comprueba `/api/health`, login, biblioteca y descargas.
5. Reprocesa jobs o webhooks únicamente con sus herramientas idempotentes.
6. Comunica alcance y estado en `/status` sin exponer detalles internos.

Para un cambio de base incompatible, despliega una migración correctiva hacia
delante. Para R2, conserva el objeto origen hasta verificar la copia y su hash.
