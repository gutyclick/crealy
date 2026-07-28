# Crealy

Base técnica y visual de Crealy, una plataforma para convertir ideas en
contenido visual mediante una experiencia sencilla asistida por inteligencia
artificial.

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Validación

```bash
npm run lint
npm run build
```

El proyecto utiliza Next.js App Router, TypeScript estricto y Tailwind CSS.

## Supabase setup

1. Crea o selecciona un proyecto en
   [Supabase](https://supabase.com/dashboard).
2. Desde **Connect**, copia el Project URL y la Publishable Key.
3. Copia `.env.example` como `.env.local` y completa:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Abre el SQL Editor de Supabase y ejecuta
   `supabase/migrations/20260728000000_create_profiles.sql`. El proyecto no
   incluye Supabase CLI, por lo que esta migración no se considera aplicada
   hasta ejecutarla manualmente.
5. En **Authentication → URL Configuration**, configura:
   - Site URL de desarrollo: `http://localhost:3000`
   - Redirect URL de desarrollo: `http://localhost:3000/**`
   - Site URL de producción: el mismo origen definido en
     `NEXT_PUBLIC_SITE_URL`
   - Redirect URL de producción: `https://tu-dominio-real.com/**`
6. Para Preview Deployments, añade únicamente las URLs de preview que
   realmente vayas a utilizar. No habilites redirects externos genéricos.
7. Revisa que la confirmación de correo esté activa y verifica las plantillas
   **Confirm signup**, **Reset password**, **Magic link** y **Change email**.
   Los enlaces de confirmación y recuperación deben volver a
   `/auth/callback`.
8. Ejecuta `npm run dev` y prueba registro, confirmación, login, recuperación y
   cierre de sesión.

Para regenerar los tipos cuando Supabase CLI esté configurado:

```bash
npx supabase gen types typescript --project-id TU_PROJECT_ID > src/types/database.ts
```

### Vercel

Añade `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y
`NEXT_PUBLIC_SITE_URL` en los entornos Development, Preview y Production que
correspondan. No subas `.env.local` ni utilices la Service Role Key en esta
fase. Añade también el dominio final y las previews autorizadas a las Redirect
URLs de Supabase.
