# Métricas y presupuesto

## Embudo privado

Medir, sin prompts ni contenido: registro iniciado/completado, correo
confirmado, objetivo elegido, ejemplo visto, configuración recomendada cargada,
onboarding completado, primera generación iniciada/completada, primera descarga,
invitación a Firma Visual, checkout iniciado y soporte creado.

La definición única de activación es: usuario que descarga su primer resultado.
La retención inicial es el porcentaje de esos usuarios que vuelve a usar Crealy
en los siete días siguientes. El denominador de esta cohorte solo incluye
usuarios cuya ventana de siete días ya terminó.

## Salud

- Jobs: p50/p95, fallos y trabajos estancados por espera, preparación,
  generación, evaluación, corrección y procesamiento/almacenamiento.
- Proveedores: errores seguros por OpenAI, Stripe, R2, Resend y Supabase.
- Coste: imágenes por usuario/día, créditos reservados/liberados y bytes activos.
- Producto: tasa y tiempo hasta primera descarga, y retorno durante siete días.

## Presupuesto inicial

- LCP móvil p75 ≤ 2,5 s; INP p75 ≤ 200 ms; CLS p75 ≤ 0,1.
- JS inicial de nuevas páginas públicas: evitar dependencias cliente innecesarias.
- Imágenes visibles: tamaños responsivos, dimensiones declaradas y WebP/AVIF.
- Fuentes: una familia principal y una mono auxiliar, con pesos limitados.
- Terceros: ninguno nuevo en el primer viewport sin una razón medida.

Línea base del 29 de julio de 2026: build de 65 rutas aprobado y revisión visual
manual en escritorio y 390 px sin desbordamientos en las superficies nuevas.
Todavía no existe una muestra de campo suficiente para publicar valores p75;
Speed Insights debe aportar esa medición durante la beta.

Vercel Analytics y Speed Insights permanecen detrás de flags y están activos en
los entornos desplegados desde el 9 de agosto de 2026. Los eventos no incluyen
prompts, imágenes, correos ni identificadores financieros. Revisar periódicamente
si la jurisdicción aplicable exige un mecanismo adicional de consentimiento.
