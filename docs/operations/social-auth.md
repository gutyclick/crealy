# Acceso con Google y Discord

Crealy usa Supabase Auth con flujo PKCE. El código de la aplicación redirige a
`https://www.crealy.app/auth/callback`; Google y Discord deben redirigir primero
al callback propio del proyecto de Supabase:

```text
https://hahneehmbjizrwanxylx.supabase.co/auth/v1/callback
```

## Google

1. En Google Auth Platform crea un cliente OAuth de tipo **Web application**.
2. Usa `https://www.crealy.app` como origen autorizado.
3. Usa el callback de Supabase anterior como URI de redirección autorizada.
4. Configura los scopes `openid`, `userinfo.email` y `userinfo.profile`.
5. Pega el Client ID y Client Secret en Supabase → Authentication → Providers → Google.

## Discord

1. En Discord Developer Portal crea una aplicación.
2. En OAuth2 agrega el callback de Supabase anterior como Redirect URI.
3. Pega el Client ID y Client Secret en Supabase → Authentication → Providers → Discord.

## Supabase y Vercel

En Supabase → Authentication → URL Configuration:

- Site URL: `https://www.crealy.app`
- Redirect URL: `https://www.crealy.app/auth/callback`
- Para previews controlados puede agregarse su URL exacta; evita comodines amplios en producción.

Cuando ambos proveedores estén guardados y habilitados en Supabase, activa en
Vercel para Production y Preview:

```text
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true
NEXT_PUBLIC_DISCORD_AUTH_ENABLED=true
```

Los Client Secrets pertenecen exclusivamente a Google/Discord y Supabase. No se
guardan en Vercel, `.env.local` ni `.env.example`.
