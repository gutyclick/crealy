# Checklist de despliegue

1. Aplicar migraciones de Supabase en orden; nunca editar una ya aplicada.
2. Configurar todas las variables de `.env.example` en Production y Preview.
3. Generar `CRON_SECRET` e `IP_HASH_SALT` distintos, largos y aleatorios.
4. Mantener `SUPABASE_SECRET_KEY`, OpenAI, Stripe y secretos únicamente en servidor.
5. Configurar estimaciones de costo según uso real antes de activar presupuestos.
6. Ejecutar `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`.
7. Verificar `/api/health` y `/api/ready`.
8. Crear una generación y una edición, recargar durante el proceso y confirmar recuperación.
9. Comprobar consumo/liberación de créditos y que no existan dobles cargos.
10. Revisar Cron Jobs y Runtime Logs en Vercel tras el despliegue.

Rollback de aplicación: restaurar el deployment anterior. Las migraciones son aditivas; no borrar tablas durante un incidente. Desactivar `JOBS_WORKER_ENABLED` para detener nuevo procesamiento y conservar la cola.
