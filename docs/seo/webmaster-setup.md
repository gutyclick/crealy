# Search Console, Bing e indicadores SEO

## Variables de producción

Configurar en Vercel, para Production:

```text
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<token de Google>
NEXT_PUBLIC_BING_SITE_VERIFICATION=<token de Bing>
```

Usar únicamente el valor de `content` de cada etiqueta de verificación. Después
de cambiar las variables, volver a desplegar y confirmar que el HTML público
contiene `google-site-verification` y `msvalidate.01`.

## Google Search Console

1. Crear una propiedad de dominio para `crealy.app` y verificarla por DNS en
   Cloudflare. La verificación HTML del proyecto queda como respaldo.
2. En **Sitemaps**, enviar `https://www.crealy.app/sitemap.xml`.
3. Inspeccionar y solicitar indexación de la portada, precios, herramientas y
   las cuatro páginas comerciales.
4. No solicitar indexación del dashboard, autenticación, API o páginas de
   resultados privados.

## Bing Webmaster Tools

La opción recomendada es **Importar desde Google Search Console**, que importa
la propiedad verificada y sus sitemaps. Como alternativa:

1. Añadir `https://www.crealy.app` en Bing Webmaster Tools.
2. Elegir verificación por metaetiqueta y copiar el token a
   `NEXT_PUBLIC_BING_SITE_VERIFICATION`.
3. En **Sitemaps**, enviar `https://www.crealy.app/sitemap.xml`.
4. Confirmar que Bing muestra el sitemap como procesado, no solo descubierto.

El código no puede autorizar cuentas de Google o Microsoft. Los pasos de alta,
verificación e importación deben completarse desde la cuenta propietaria.

## Revisión semanal durante las primeras ocho semanas

Registrar cada lunes, comparando últimos 7 días con los 7 anteriores:

| Indicador | Fuente | Segmentación mínima |
| --- | --- | --- |
| Páginas indexadas y excluidas | Search Console / Bing | Motivo de exclusión |
| Impresiones | Search Console | Página, consulta, país, dispositivo |
| Clics y CTR | Search Console | Página y consulta |
| Posición media | Search Console | Consultas con al menos 10 impresiones |
| Visitas orgánicas | Vercel Analytics | Landing de entrada |
| CTA hacia registro | Evento `seo_cta_clicked` | Propiedad `landing` |
| Conversión visita → CTA | Vercel Analytics | Cada página comercial |
| LCP, INP y CLS | Speed Insights | Móvil y escritorio |

No tomar decisiones por CTR con muestras menores a 100 impresiones. Priorizar:

- URLs descubiertas pero no indexadas durante más de 14 días.
- Consultas con muchas impresiones, posición 4–15 y CTR bajo.
- Páginas con tráfico orgánico pero sin `seo_cta_clicked`.
- Diferencias importantes entre móvil y escritorio.

## Páginas iniciales a observar

- `/generador-miniaturas-youtube`
- `/crear-posts-redes-sociales`
- `/generador-banners-portadas`
- `/recreate-disenos`
- `/tools`
- `/pricing`

Vercel Analytics mide las visitas mediante `seo_landing_viewed`; Search Console
y Bing son las fuentes autoritativas para impresiones, consultas, CTR e
indexación. No se envían prompts, imágenes, correos ni identificadores de usuario
en estos eventos.
