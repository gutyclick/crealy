# Sentry y alertas operativas

Crealy inicializa Sentry en browser, Node.js y Edge. No envía PII por defecto. Configura en Vercel:

- `SENTRY_DSN` y `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` y `SENTRY_PROJECT` para source maps
- tasas de trazas con `SENTRY_TRACES_SAMPLE_RATE` y `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`

El cron `/api/internal/operations/monitor` requiere `Authorization: Bearer CRON_SECRET`. El repositorio lo programa una vez al día para ser compatible con Vercel Hobby. En Pro, cambia su expresión a `*/10 * * * *` para detección cada diez minutos. También puede invocarlo un monitor externo con el mismo encabezado. Emite issues agrupados y métricas para:

- tasa de generaciones fallidas;
- jobs atascados;
- reservas de créditos abiertas;
- consumo frente al presupuesto diario;
- latencia de OpenAI;
- fallos de webhooks y almacenamiento.

Los umbrales se controlan con las variables `ALERT_*` documentadas en `.env.example`. En Sentry, crea reglas de Issue Alert para los tags `operational_alert` y una notificación inmediata al canal del equipo. Los fingerprints impiden que cada ejecución abra un incidente distinto.

Vercel Cron añade automáticamente el encabezado de autorización cuando `CRON_SECRET` está configurado. No invoques el monitor desde el navegador ni expongas su respuesta públicamente.
