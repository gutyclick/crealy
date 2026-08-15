# E2E autenticado

Esta suite crea usuarios y datos efímeros, valida los flujos privados y elimina las cuentas al terminar. Debe utilizar exclusivamente un proyecto Supabase de testing sin datos reales.

Variables requeridas:

```text
E2E_ALLOW_REMOTE_TEST_PROJECT=true
E2E_REQUIRE_CONFIG=true
E2E_SUPABASE_URL=https://<proyecto-test>.supabase.co
E2E_SUPABASE_PUBLISHABLE_KEY=...
E2E_SUPABASE_SECRET_KEY=...
E2E_SUPABASE_PROJECT_REF=<proyecto-test>
NEXT_PUBLIC_SUPABASE_URL=<mismo valor que E2E_SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<misma clave pública E2E>
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true
NEXT_PUBLIC_DISCORD_AUTH_ENABLED=true
STRIPE_SECRET_KEY=sk_test_e2e_contract_only
STRIPE_WEBHOOK_SECRET=whsec_e2e_contract_only
E2E_STRIPE_WEBHOOK_SECRET=whsec_e2e_contract_only
```

La URL, la referencia del proyecto y el indicador explícito deben coincidir. En CI, `E2E_REQUIRE_CONFIG=true` hace fallar el job si la configuración está incompleta; localmente la suite se omite mientras no exista autorización expresa.

La cobertura incluye registro por correo, entrega segura a Google y Discord, login y logout, separación de Create y Recreate, reserva y devolución de créditos, firma e idempotencia del webhook, activación visible de planes, MFA, RLS, descargas aisladas y un recorrido móvil sin desbordes. La prueba OAuth valida el handoff a Supabase sin entregar credenciales reales a Google o Discord.

Ejecuta `npm run test:e2e:authenticated`. En GitHub, define `E2E_AUTH_ENABLED=true` y `E2E_SUPABASE_PROJECT_REF` como variables del repositorio, y carga URL y claves E2E como secretos.
