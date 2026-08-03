# E2E autenticado

Esta suite crea dos usuarios efímeros, valida acceso privado y los elimina al terminar. Debe utilizar exclusivamente un proyecto Supabase de testing sin datos reales.

Variables requeridas:

```text
E2E_ALLOW_REMOTE_TEST_PROJECT=true
E2E_SUPABASE_URL=https://<proyecto-test>.supabase.co
E2E_SUPABASE_PUBLISHABLE_KEY=...
E2E_SUPABASE_SECRET_KEY=...
NEXT_PUBLIC_SUPABASE_URL=<mismo valor que E2E_SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<misma clave pública E2E>
```

La igualdad de URLs y el indicador explícito son obligatorios. La suite se omite si falta cualquiera de estas protecciones.

Ejecuta `npm run test:e2e`. En GitHub, define `E2E_AUTH_ENABLED=true` como variable del repositorio y carga las credenciales E2E como secretos.
