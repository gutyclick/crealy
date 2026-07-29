# Runbook: descuadre de créditos

1. Ejecutar `npm run ops:credits` para listar reservas activas cuyo recurso terminó o desapareció.
2. Comparar `credit_accounts`, grants, reservations y transactions del usuario.
3. Confirmar que el job es terminal antes de liberar.
4. Ejecutar `npm run ops:credits -- --execute` sólo después de revisar la lista.
5. No editar balances directamente. Toda corrección debe pasar por las funciones financieras idempotentes.

Si un recurso está completado sin transacción de consumo, detener el worker y escalar: no regenerar ni otorgar créditos automáticamente.
