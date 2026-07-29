# Runbook: jobs atascados

Síntomas: jobs en `claimed`/`processing` con `visibility_expires_at` vencido o crecimiento sostenido de `queued`.

1. Ejecutar `npm run ops:jobs` (dry-run).
2. Revisar Runtime Logs por `job.started`, `job.retry_scheduled` y `job.failed`.
3. Confirmar `/api/ready`, OpenAI y Supabase.
4. Para recuperar claims vencidos, ejecutar `npm run ops:jobs -- --execute`.
5. Invocar `GET /api/internal/jobs/tick` con `Authorization: Bearer $CRON_SECRET`.
6. Si la causa continúa, poner `JOBS_WORKER_ENABLED=false`; no borrar jobs ni reservas.

Escalar si una misma causa agota intentos o la cola aumenta durante 15 minutos.
