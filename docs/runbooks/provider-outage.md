# Runbook: caída de OpenAI

Indicadores: aumento de `provider_rate_limit`, `provider_unavailable` o latencia cercana al visibility timeout.

1. Confirmar el estado oficial del proveedor y la validez/cuota de la API key.
2. Reducir `JOBS_GLOBAL_CONCURRENCY` si hay `429`.
3. Si la indisponibilidad es sostenida, desactivar `OPENAI_GENERATION_ENABLED` y `OPENAI_EDITING_ENABLED`.
4. Mantener jobs transitorios en retry; no liberar manualmente reservas activas.
5. Al recuperar servicio, reactivar flags y ejecutar el tick interno.

Los errores de moderación o entrada no deben reintentarse.
