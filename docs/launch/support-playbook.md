# Playbook de soporte

Categorías: cuenta, generación, edición, cobros, almacenamiento y privacidad.
Responde con un número de caso; solicita IDs internos, no contraseñas, claves,
prompts completos, imágenes privadas ni datos de tarjeta.

## Prioridad

- P0: acceso cruzado, cobro masivo incorrecto o secreto expuesto. Desactiva la
  función, preserva evidencia y escala inmediatamente.
- P1: creación, login o facturación indisponible para varios usuarios.
- P2: fallo individual con alternativa disponible.
- P3: pregunta, sugerencia o problema cosmético.

Para reembolsos verifica el pago en Stripe y aplica la política publicada. Para
exportación o eliminación valida identidad y registra la solicitud. Los
mensajes públicos de estado deben ser generales.

Objetivos internos iniciales, no compromisos públicos: P0 inmediato, P1 durante
la misma jornada operativa y P2/P3 en la siguiente revisión de soporte. Escala
créditos incorrectos a reconciliación, cobros duplicados a Stripe, archivos
perdidos al inventario de storage y fallos de generación al ID de job.
