# Crealy

Crealy incluye un centro público en `/tools` para previsualizar, comprobar y
analizar piezas visuales. La configuración operativa y de privacidad está
documentada en [`docs/operations/visual-tools.md`](docs/operations/visual-tools.md).

Plataforma en Next.js para convertir un brief breve en una pieza visual
generada con OpenAI, guardada de forma privada en Supabase y disponible desde
una biblioteca personal.

## GPT Image 2 y formatos

Crealy usa `gpt-image-2` y solicita el tamaño final directamente. Las miniaturas
de YouTube son 1920 × 1080; las portadas de canal de YouTube son 2560 × 1440
con zona segura central de 1235 × 338. X exporta 1500 × 500, LinkedIn
1584 × 396 y Facebook se limita en esta fase a portada de página o perfil.
Todas las portadas fuerzan calidad alta. La respuesta se inspecciona y guarda
dimensiones reales del proveedor y de exportación. Si OpenAI rechaza una
dimensión flexible, se reintenta una sola vez con el formato compatible más
cercano y se registra el motivo; `sharp` solo adapta ese fallback y crea previews.
4K permanece oculto con `FOUR_K_GENERATION_ENABLED=false` y no se ha certificado.

Los estilos visuales viven en `src/config/visual-styles.ts`, con ejemplos locales
en `public/styles`. El modo Automático usa reglas deterministas y no consume una
segunda llamada. Las paletas personalizadas aceptan de uno a cinco valores
`#RGB` o `#RRGGBB`.

## Cuenta y almacenamiento privado

Configuración incluye perfil, cambio de correo confirmado por Supabase, cambio
de contraseña, cierre de otras sesiones, TOTP, Stripe Customer Portal y gestión
de archivos. Supabase Auth no ofrece códigos de recuperación TOTP; se recomienda
un segundo factor como respaldo.

Los objetos nuevos usan la abstracción en `src/lib/storage`. Configura
`OBJECT_STORAGE_PROVIDER=r2` y las variables privadas `R2_*`; nunca uses
`NEXT_PUBLIC_` en credenciales. Los originales y previews WebP se registran en
`public.assets`, tienen cuotas, expiración, período de gracia y enlaces firmados.
La base de datos es la fuente de verdad.

Para migrar sin borrar el origen:

```bash
npm run storage:migrate-to-r2 -- --dry-run
npm run storage:migrate-to-r2 -- --execute
```

En Cloudflare R2 configura lifecycle para `temporary/`,
`uploads/unattached/` y multipart incompletos. Estas reglas son un respaldo:
el mantenimiento de Crealy debe seguir actualizando `active → expired →
deleting → deleted`.

## Desarrollo

```bash
npm install
copy .env.example .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SECRET_KEY=

OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_GENERATION_ENABLED=true
GENERATION_DAILY_LIMIT=10
GENERATION_COOLDOWN_SECONDS=15
OPENAI_RESPONSES_MODEL=gpt-5.6-luna
OPENAI_EDITING_ENABLED=true
REFERENCE_IMAGE_MAX_MB=10
REFERENCE_IMAGE_MAX_WIDTH=8192
REFERENCE_IMAGE_MAX_HEIGHT=8192
REFERENCE_IMAGE_MAX_PIXELS=40000000
EDIT_DAILY_LIMIT=20
EDIT_COOLDOWN_SECONDS=12
EDIT_SESSION_VERSION_LIMIT=20

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_MONTHLY_PRICE_ID=
STRIPE_STARTER_ANNUAL_PRICE_ID=
STRIPE_CREATOR_MONTHLY_PRICE_ID=
STRIPE_CREATOR_ANNUAL_PRICE_ID=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_ANNUAL_PRICE_ID=
STRIPE_BILLING_ENABLED=false

FREE_SIGNUP_CREDITS=3
STARTER_MONTHLY_CREDITS=10
CREATOR_MONTHLY_CREDITS=60
PRO_MONTHLY_CREDITS=180
CREDITS_COST_GENERATION_STANDARD=1
CREDITS_COST_GENERATION_HIGH=2
CREDITS_COST_EDIT=1
BILLING_GRACE_PERIOD_DAYS=3
```

`OPENAI_API_KEY` es exclusivamente de servidor. No debe llevar el prefijo
`NEXT_PUBLIC_`, guardarse en Supabase ni incluirse en el repositorio.

## Configuración de Supabase

Ejecuta las migraciones en orden desde el SQL Editor:

1. `supabase/migrations/20260728000000_create_profiles.sql`
2. `supabase/migrations/20260728010000_create_generation_pipeline.sql`
3. `supabase/migrations/20260728020000_create_editing_pipeline.sql`
4. `supabase/migrations/20260728030000_add_generation_references.sql`
5. `supabase/migrations/20260729000000_add_billing_and_credits.sql`
6. `supabase/migrations/20260729010000_harden_financial_writes.sql`
7. `supabase/migrations/20260729020000_add_financial_write_boundaries.sql`
8. `supabase/migrations/20260729030000_add_durable_jobs_and_operations.sql`
9. `supabase/migrations/20260729040000_harden_operations_and_telemetry.sql`
10. `supabase/migrations/20260729050000_consolidate_formats_and_storage.sql`
11. `supabase/migrations/20260729060000_correct_existing_upload_purpose.sql`
12. `supabase/migrations/20260729070000_correct_creation_taxonomy.sql`

La segunda migración crea `projects`, `generations`, restricciones, índices,
RLS, la reserva atómica con límites y el bucket privado `generations`. La
tercera añade cargas privadas, sesiones conversacionales, versiones, mensajes,
restauración y límites atómicos. La cuarta relaciona hasta cuatro uploads
privados con cada generación. Las dos últimas añaden suscripciones, cuentas,
grants, reservas, movimientos, eventos de Stripe y funciones financieras
reservadas al servidor. No edites una migración ya aplicada: crea una nueva.

Verifica después:

- El bucket `generations` continúa privado.
- Un usuario autenticado sólo puede leer rutas cuyo primer segmento sea su ID.
- Un usuario no puede leer proyectos, generaciones o archivos de otro usuario.
- La confirmación de correo y recuperación vuelven a `/auth/callback`.
- `NEXT_PUBLIC_SITE_URL` y las Redirect URLs coinciden con cada entorno.

Para actualizar los tipos cuando Supabase CLI esté disponible:

```bash
npx supabase gen types typescript --project-id TU_PROJECT_ID > src/types/database.ts
```

## Configuración de OpenAI

1. Crea una API key de proyecto en OpenAI Platform y configura facturación.
2. Confirma que el proyecto tiene acceso a `gpt-image-2` y revisa sus límites.
3. Guarda la clave como `OPENAI_API_KEY` en `.env.local`.
4. Inicia sesión, abre `/create` y prueba una generación.
5. Comprueba la fila en `generations`, el objeto privado en Storage, la
   visualización mediante URL firmada y la descarga autenticada.

El editor conversacional está retirado de la versión actual. Sus migraciones y
datos históricos se conservan para permitir una posible reintroducción futura,
pero `/edit` y sus endpoints no están disponibles para usuarios.

La Image API devuelve una sola imagen PNG por solicitud. Con GPT Image 2,
Crealy solicita tamaños arbitrarios válidos como cadenas `ANCHOxALTO` y
entrega estas salidas:

- Miniatura de YouTube → entrega `1280x720`
- 1:1 → `1024x1024`
- 4:5 → `1024x1280`
- 3:1 → `1536x512`
- Facebook → máster `1712x640`, entrega 2× `1702x630`
- X → máster `1536x512`, entrega `1500x500`
- LinkedIn → máster seguro 3:1, entrega `1584x396`

Las miniaturas usan una modalidad única y las portadas mantienen su calidad
adaptada al formato. Cuando las dimensiones
finales no son válidas para el proveedor (por ejemplo, LinkedIn 4:1), el
prompt usa una zona segura central y el servidor recorta el máster sin
estirar la imagen.

En `/create`, el usuario puede añadir hasta cuatro referencias PNG/JPEG/WebP.
Los bytes se suben directamente a Supabase mediante una URL firmada temporal,
evitando el límite de cuerpo de Vercel; después el servidor vuelve a descargar,
inspeccionar y registrar cada archivo antes de utilizarlo. Cuando existen
referencias, Crealy usa el endpoint de edición de Image API para componer una
nueva pieza y refuerza en el prompt la preservación de personas, productos y
objetos no solicitados para cambio.

## Stripe y créditos

1. Crea en Stripe los productos Starter, Creator y Pro con precios mensuales y anuales.
2. Copia cada ID `price_...` en su variable canónica
   `STRIPE_{STARTER|CREATOR|PRO}_{MONTHLY|ANNUAL}_PRICE_ID`.
3. Crea el webhook `https://TU_DOMINIO/api/webhooks/stripe` y escucha
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.paid`, `invoice.payment_failed`,
   `invoice.payment_action_required` y `checkout.session.expired`.
4. Copia el signing secret en `STRIPE_WEBHOOK_SECRET`, configura Customer
   Portal y activa `STRIPE_BILLING_ENABLED=true`.
5. No reutilices IDs entre planes ni conserves aliases de la oferta anterior.

Checkout y Portal son sesiones alojadas por Stripe. El navegador nunca decide
el precio ni concede créditos. `invoice.paid` concede los créditos mensuales de
forma idempotente y los intentos de generación/edición reservan saldo antes de
llamar a OpenAI.

`SUPABASE_SECRET_KEY` (o la clave legacy en
`SUPABASE_SERVICE_ROLE_KEY`), `STRIPE_SECRET_KEY` y
`STRIPE_WEBHOOK_SECRET` son exclusivamente de servidor. Nunca uses el prefijo
`NEXT_PUBLIC_` ni los imprimas en logs.

Para probar webhooks localmente:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger invoice.paid
```

### Operación y reconciliación

- Stripe es la fuente de verdad de la suscripción; Supabase conserva una copia
  operativa actualizada por webhooks firmados.
- Revisa `stripe_events` cuando un evento falle. El `event_id`, tipo, estado y
  código seguro permiten investigar sin guardar el payload ni secretos.
- Stripe reintenta respuestas no exitosas. El mismo evento y la misma factura
  pueden reprocesarse con seguridad porque ambos usan claves idempotentes.
- Para reconciliar una suscripción, reenvía desde Stripe Dashboard uno de sus
  eventos `customer.subscription.updated` o `invoice.paid`.
- Cambia `STARTER_MONTHLY_CREDITS`, `CREATOR_MONTHLY_CREDITS` o
  `PRO_MONTHLY_CREDITS` solo para ciclos futuros. No edites movimientos,
  grants ni saldos históricos directamente.

### Ciclo de los créditos

- Cada cuenta recibe `FREE_SIGNUP_CREDITS` una sola vez.
- Una factura mensual pagada crea un grant idempotente con vencimiento al final
  del ciclo.
- Antes de llamar a OpenAI, Crealy reserva los grants con vencimiento más
  cercano. Al completar consume la reserva; al fallar la libera.
- Cuenta, grants, reserva, movimiento y resultado se actualizan mediante
  funciones transaccionales con bloqueo de filas; el saldo no puede ser
  negativo.

## Límites y control de costes

- `OPENAI_GENERATION_ENABLED=false`: detiene nuevas llamadas sin desplegar
  código distinto.
- Sólo se genera una imagen por llamada y una generación puede estar activa por
  usuario.
- Los reintentos automáticos se reservan para fallos transitorios (`429`,
  `5xx`, red o storage) y usan backoff acotado. Los errores de entrada o
  moderación son definitivos.
- `EDIT_SESSION_VERSION_LIMIT` controla el tamaño de una sesión conversacional.
- `OPENAI_EDITING_ENABLED=false` detiene nuevas ediciones sin afectar la
  biblioteca ni las descargas.
- Sólo puede existir una edición activa por usuario. Si el contexto del
  proveedor caduca, se reintenta una vez sin ese identificador y usando la
  versión actual como referencia.

Cada llamada real consume saldo de OpenAI, incluidas las realizadas desde
Preview Deployments.

## Almacenamiento privado

`STORAGE_PROVIDER=supabase` conserva el comportamiento actual. Para Cloudflare
R2 configura `STORAGE_PROVIDER=r2`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY` y `R2_BUCKET_NAME`. El bucket debe ser privado y su CORS
debe permitir `PUT` desde el dominio de Crealy. El navegador recibe únicamente
una URL firmada temporal; las credenciales permanecen en el servidor.

Las referencias de generación caducan a los 30 días. El mantenimiento diario
elimina primero el objeto y después su registro, pero conserva archivos usados
como fuente de una sesión de edición o de un trabajo activo. Configura también
una regla de lifecycle de R2 como defensa adicional, nunca como única fuente de
verdad.

## Vercel

Añade todas las variables anteriores por separado en Development, Preview y
Production. Usa claves de OpenAI separadas o con límites adecuados cuando sea
posible. No imprimas secretos en logs de build. Añade los dominios finales y
previews autorizados a Supabase Authentication.

## Validación

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Preparación para lanzamiento

Producción opera como un servicio público, con registro abierto y sin invitación obligatoria. La configuración se centraliza con
`NEXT_PUBLIC_LAUNCH_STAGE`, `REGISTRATIONS_ENABLED`, `INVITE_REQUIRED` y los
flags de generación, edición, cobros, herramientas, correo y analítica. No
actives una integración hasta que sus credenciales y webhooks estén probados.

```bash
npm run check:secrets
npm run validate:production-env
npm run test:e2e
npm run smoke:production -- https://www.crealy.app
```

Para email transaccional, verifica el dominio en Resend, configura
`RESEND_API_KEY`, remitente, reply-to y secreto del webhook
`/api/webhooks/resend`, y después activa `TRANSACTIONAL_EMAILS_ENABLED`.
Configura también SMTP personalizado en Supabase Auth; Resend no sustituye los
correos de confirmación y recuperación administrados por Supabase.

Analytics y Speed Insights están desactivados por defecto. Sus eventos solo
incluyen nombres de flujo y métricas seguras, nunca prompts, imágenes, correos
ni texto del usuario. Antes de habilitarlos, revisa privacidad, retención y la
necesidad de consentimiento.

Las páginas `/privacy`, `/terms`, `/cookies`, `/acceptable-use` y
`/refund-policy` son borradores provisionales. **Se requiere revisión legal
antes de cualquier lanzamiento público.**

La guía de salida está en
[`docs/launch/production-checklist.md`](docs/launch/production-checklist.md);
incluye el [plan de beta](docs/launch/beta-plan.md), el
[playbook de soporte](docs/launch/support-playbook.md) y el
[procedimiento de rollback](docs/launch/rollback.md).

## Operación en producción

La generación y la edición se procesan mediante jobs durables en Supabase. Las
APIs devuelven `202 Accepted`; el estado real se consulta en `/api/jobs/:id` y
la interfaz se recupera aunque el usuario recargue la página.

- Liveness: `GET /api/health`
- Readiness: `GET /api/ready`
- Recuperación protegida: `GET /api/internal/jobs/tick`
- Publicador de outbox protegido: `POST /api/internal/jobs/publish`
- Inspección dry-run: `npm run ops:jobs`, `ops:credits`, `ops:storage` y
  `ops:billing`

La API pública nunca ejecuta jobs. El consumidor protegido es la única ruta que
publica el outbox, reclama y procesa trabajos. La programación por minuto de
`vercel.json` requiere Vercel Pro o un scheduler externo equivalente.

Los comandos de reconciliación no escriben por defecto. Para ejecutar una
corrección revisada usa `-- --execute`. Consulta
[`docs/operations/architecture.md`](docs/operations/architecture.md) y los
runbooks en [`docs/runbooks`](docs/runbooks).
