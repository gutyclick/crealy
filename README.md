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

OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_GENERATION_ENABLED=true
GENERATION_DAILY_LIMIT=10
GENERATION_COOLDOWN_SECONDS=15
```

`OPENAI_API_KEY` es exclusivamente de servidor. No debe llevar el prefijo
`NEXT_PUBLIC_`, guardarse en Supabase ni incluirse en el repositorio.

## Configuración de Supabase

Ejecuta las migraciones en orden desde el SQL Editor:

1. `supabase/migrations/20260728000000_create_profiles.sql`
2. `supabase/migrations/20260728010000_create_generation_pipeline.sql`

La segunda migración crea `projects`, `generations`, restricciones, índices,
RLS, la reserva atómica con límites y el bucket privado `generations`. El
repositorio no incluye Supabase CLI, por lo que estos archivos no se consideran
aplicados hasta ejecutarlos manualmente.

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

La Image API devuelve una sola imagen PNG por solicitud. Crealy conserva el
formato solicitado y lo mapea a estas salidas del modelo:

- 16:9 → `1536x864`
- 1:1 → `1024x1024`
- 4:5 → `1024x1280`
- 3:1 → `1536x512`
- 12:5 → `1536x640`

La interfaz usa `object-fit: contain`, por lo que nunca estira el resultado.

## Límites y control de costes

- `GENERATION_DAILY_LIMIT`: máximo diario por usuario.
- `GENERATION_COOLDOWN_SECONDS`: espera mínima entre solicitudes.
- `OPENAI_GENERATION_ENABLED=false`: detiene nuevas llamadas sin desplegar
  código distinto.
- Sólo se genera una imagen por llamada y una generación puede estar activa por
  usuario.
- No existen reintentos automáticos, generación al cargar ni una segunda
  llamada para reescribir prompts.

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
