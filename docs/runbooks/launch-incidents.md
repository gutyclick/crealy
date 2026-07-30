# Runbook: incidentes de lanzamiento

## Matriz de mitigación

| Señal | Mitigación inmediata | Se conserva |
| --- | --- | --- |
| OpenAI caído o presupuesto agotado | `OPENAI_GENERATION_ENABLED=false`, `OPENAI_EDITING_ENABLED=false` | historial, descargas y jobs existentes |
| Stripe caído o webhook inestable | `STRIPE_BILLING_ENABLED=false` | webhooks, portal e historial financiero |
| Supabase degradado | bloquear ampliación de beta y evitar escrituras manuales | datos y sesiones existentes |
| R2 degradado | detener nuevos uploads/jobs que escriben objetos | referencias de base y objetos existentes |
| Resend caído | `TRANSACTIONAL_EMAILS_ENABLED=false` | producto, Auth de Supabase y cola |
| Jobs atascados | `JOBS_WORKER_ENABLED=false`, inspección dry-run | outbox, reservas y reintentos |
| Registros abusivos | `REGISTRATIONS_ENABLED=false` o `INVITE_REQUIRED=true` | login de usuarios existentes |
| Herramientas abusadas | `TOOLS_ENABLED=false` y límites más conservadores | aplicación privada |

Para una clave filtrada: desactívala en el proveedor, rota en todos los
entornos, vuelve a desplegar, inspecciona uso y registra el incidente sin
copiar el valor. Para borrado accidental: detén escrituras, abre incidente con
Supabase/Cloudflare, restaura desde una copia verificada y reconcilia el
inventario; R2 no es un backup de PostgreSQL.

No reintentes indiscriminadamente webhooks ni jobs. Usa sus claves idempotentes
y los runbooks específicos de `docs/runbooks`.
