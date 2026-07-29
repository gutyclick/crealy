# Runbook: abuso o incidente de seguridad

1. Rotar inmediatamente el secreto afectado en Vercel y el proveedor.
2. Desactivar el feature flag correspondiente o `JOBS_WORKER_ENABLED`.
3. Revisar contadores de rate limit, jobs, uso del proveedor y logs por IDs; no exportar contenido sensible.
4. Reducir límites y concurrencia mientras se investiga.
5. Revocar sesiones/keys comprometidas y comprobar RLS.
6. Documentar alcance, ventana temporal y acciones tomadas.

Nunca registrar prompts, imágenes, cookies, tokens, claves, correos completos ni payloads de Stripe/OpenAI.
