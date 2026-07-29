# Runbook: archivos huérfanos

1. Ejecutar `npm run ops:storage` para comparar `user_uploads` con el bucket privado.
2. Verificar antigüedad y confirmar que ninguna subida esté en curso.
3. Ejecutar `npm run ops:storage -- --execute` para eliminar sólo las rutas listadas.
4. Para outputs de generaciones/ediciones, comparar también el recurso y job antes de eliminar manualmente.

Nunca hacer borrados recursivos por prefijo de usuario sin una lista exacta y revisada.
