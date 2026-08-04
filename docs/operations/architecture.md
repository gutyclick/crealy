# Arquitectura operativa

Crealy usa PostgreSQL/Supabase como cola durable. La API autentica, valida, aplica límites, reserva créditos y crea el recurso, `jobs` y `job_outbox` en una sola transacción. Responde `202` sin ejecutar el trabajo. El polling del cliente es estrictamente de lectura y nunca dispara procesamiento.

El worker reclama con `FOR UPDATE SKIP LOCKED`, aplica concurrencia global y por usuario, crea un intento y establece un visibility timeout. Sólo los errores transitorios (`429`, `5xx`, red o storage temporal) se reintentan con backoff. Los errores de entrada, moderación o integridad son definitivos y liberan la reserva.

`GET /api/internal/jobs/tick`, protegido por `CRON_SECRET`, es el consumidor explícito: publica el outbox, recupera claims vencidos, reclama y procesa un lote observable. Vercel lo invoca cada minuto; esto requiere Pro. Un scheduler externo puede invocar la misma ruta con el encabezado de autorización. No existe un camino de procesamiento dentro de las funciones web públicas.

La idempotencia se garantiza localmente mediante `(user_id, idempotency_key)`, rutas deterministas de storage y funciones financieras idempotentes. OpenAI no documenta idempotencia para Images API, por lo que no se asume soporte del proveedor.

Los logs son JSON estructurado e incluyen IDs, duración, intento y código seguro. Nunca incluyen prompts, imágenes, tokens, correos o respuestas completas del proveedor.
