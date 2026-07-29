# Crealy

Plataforma en Next.js para convertir un brief breve en una pieza visual
generada con OpenAI, guardada de forma privada en Supabase y disponible desde
una biblioteca personal.

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
STRIPE_PRO_PRICE_ID=
STRIPE_PRO_PRICE_DISPLAY=
STRIPE_BUSINESS_PRICE_ID=
STRIPE_BUSINESS_PRICE_DISPLAY=
STRIPE_BILLING_ENABLED=false
BUSINESS_PLAN_ENABLED=false

FREE_SIGNUP_CREDITS=5
PRO_MONTHLY_CREDITS=100
BUSINESS_MONTHLY_CREDITS=500
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

Para probar la edición, abre `/edit`, carga una imagen PNG/JPEG/WebP o entra a
una creación existente y pulsa **Editar imagen**. Crealy usa Responses API con
la herramienta oficial de generación de imágenes. Los identificadores de
continuidad permanecen en servidor y cada cambio produce una versión
recuperable.

La Image API devuelve una sola imagen PNG por solicitud. Crealy conserva el
formato solicitado y lo mapea a estas salidas del modelo:

- 16:9 → `1536x864`
- 1:1 → `1024x1024`
- 4:5 → `1024x1280`
- 3:1 → `1536x512`
- 12:5 → `1536x640`

La interfaz usa `object-fit: contain`, por lo que nunca estira el resultado.

En `/create`, el usuario puede añadir hasta cuatro referencias PNG/JPEG/WebP.
Los bytes se suben directamente a Supabase mediante una URL firmada temporal,
evitando el límite de cuerpo de Vercel; después el servidor vuelve a descargar,
inspeccionar y registrar cada archivo antes de utilizarlo. Cuando existen
referencias, Crealy usa el endpoint de edición de Image API para componer una
nueva pieza y refuerza en el prompt la preservación de personas, productos y
objetos no solicitados para cambio.

## Stripe y créditos

1. Crea en Stripe un producto Pro con un precio recurrente mensual.
2. Copia el ID `price_...` en `STRIPE_PRO_PRICE_ID` y el texto público real
   (por ejemplo, `$19`) en `STRIPE_PRO_PRICE_DISPLAY`.
3. Crea el webhook `https://TU_DOMINIO/api/webhooks/stripe` y escucha
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.paid`, `invoice.payment_failed`,
   `invoice.payment_action_required` y `checkout.session.expired`.
4. Copia el signing secret en `STRIPE_WEBHOOK_SECRET`, configura Customer
   Portal y activa `STRIPE_BILLING_ENABLED=true`.
5. Mantén `BUSINESS_PLAN_ENABLED=false` hasta tener un precio real.

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
- Cambia `PRO_MONTHLY_CREDITS` solo para ciclos futuros. No edites movimientos,
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
- No existen reintentos automáticos, generación al cargar ni una segunda
  llamada para reescribir prompts.
- `EDIT_SESSION_VERSION_LIMIT` controla el tamaño de una sesión conversacional.
- `OPENAI_EDITING_ENABLED=false` detiene nuevas ediciones sin afectar la
  biblioteca ni las descargas.
- Sólo puede existir una edición activa por usuario. Si el contexto del
  proveedor caduca, se reintenta una vez sin ese identificador y usando la
  versión actual como referencia.

Cada llamada real consume saldo de OpenAI, incluidas las realizadas desde
Preview Deployments.

## Vercel

Añade todas las variables anteriores por separado en Development, Preview y
Production. Usa claves de OpenAI separadas o con límites adecuados cuando sea
posible. No imprimas secretos en logs de build. Añade los dominios finales y
previews autorizados a Supabase Authentication.

## Validación

```bash
npm run lint
npx tsc --noEmit
npm run build
```
