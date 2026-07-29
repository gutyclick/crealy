# Arquitectura operativa

Crealy usa PostgreSQL/Supabase como cola durable. La API autentica, valida, aplica límites, reserva créditos y crea el recurso, `jobs` y `job_outbox` en una sola transacción. Responde `202` y Next `after()` dispara el worker. El polling del cliente vuelve a disparar jobs elegibles y permite recuperarlos tras recargar.

El worker reclama con `FOR UPDATE SKIP LOCKED`, aplica concurrencia global y por usuario, crea un intento y establece un visibility timeout. Sólo los errores transitorios (`429`, `5xx`, red o storage temporal) se reintentan con backoff. Los errores de entrada, moderación o integridad son definitivos y liberan la reserva.

La ruta interna diaria recupera claims vencidos y procesa un lote pequeño. El cron diario es compatible con Vercel Hobby; en Pro puede cambiarse a una frecuencia mayor. La cola no depende del cron para el camino normal.

La idempotencia se garantiza localmente mediante `(user_id, idempotency_key)`, rutas deterministas de storage y funciones financieras idempotentes. OpenAI no documenta idempotencia para Images API, por lo que no se asume soporte del proveedor.

Los logs son JSON estructurado e incluyen IDs, duración, intento y código seguro. Nunca incluyen prompts, imágenes, tokens, correos o respuestas completas del proveedor.
