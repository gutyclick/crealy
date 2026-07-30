# Centro de herramientas visuales

## Alcance

Las rutas bajo `/tools` son públicas. Las herramientas de tamaño, zonas
seguras, comparación y previews procesan los archivos en el navegador; no
crean assets ni los envían al servidor.

El analizador de miniaturas requiere una sesión autenticada. Envía los bytes
de la imagen directamente a OpenAI mediante Responses API con Structured
Outputs y `store: false`. Crealy conserva el resultado estructurado y datos
técnicos de la solicitud, pero no guarda el archivo analizado.

## YouTube

El descargador de miniaturas acepta únicamente IDs de video validados y
construye URLs del CDN desde una tabla cerrada de variantes. El proxy:

- permite hosts exactos de YouTube;
- exige HTTPS y bloquea credenciales y puertos;
- no sigue redirecciones;
- limita tiempo, tamaño y tipos MIME;
- no almacena el archivo.

El descargador de banners usa `channels.list` de YouTube Data API. Configura
`YOUTUBE_DATA_API_KEY` en Vercel. Las URLs de canal admitidas son
`/channel/UC…` y `/@handle`. Si la API oficial no devuelve un banner, la
herramienta no intenta obtenerlo mediante scraping.

## IA y créditos

Variables:

```text
OPENAI_ANALYSIS_MODEL=gpt-5.4-mini
THUMBNAIL_ANALYSIS_ENABLED=true
THUMBNAIL_ANALYSIS_DAILY_LIMIT=5
THUMBNAIL_ANALYSIS_FREE_DAILY_LIMIT=1
THUMBNAIL_ANALYSIS_CREDIT_COST=1
```

La visibilidad se controla de forma central con:

```text
NEXT_PUBLIC_TOOLS_ENABLED=true
NEXT_PUBLIC_YOUTUBE_DOWNLOADS_ENABLED=true
NEXT_PUBLIC_THUMBNAIL_ANALYSIS_ENABLED=true
NEXT_PUBLIC_THUMBNAIL_COMPARATOR_ENABLED=true
```

El primer análisis exitoso del día es gratuito por defecto. Los siguientes
reservan el crédito antes de llamar al proveedor, lo consumen al completar y
lo liberan ante un fallo. Las migraciones `20260729100000` y `20260729110000`
registran idempotencia, estado, resultado y la referencia financiera.

## Límites

```text
TOOLS_PUBLIC_REQUESTS_PER_MINUTE=60
YOUTUBE_DOWNLOADER_REQUESTS_PER_MINUTE=30
```

Los límites usan los contadores compartidos de operaciones y un hash de IP. El
analizador aplica además límites por usuario e IP y un máximo diario.

## Privacidad y contenido

- No registrar URLs completas, prompts, archivos ni respuestas del proveedor.
- Los eventos analíticos solo incluyen la herramienta y la acción.
- Las descargas deben acompañarse de una advertencia de derechos de autor.
- Las puntuaciones del analizador son una crítica visual y nunca una
  predicción de CTR o resultados.

## Verificación externa

Las pruebas unitarias no llaman a YouTube ni OpenAI. Para validar banners en
un entorno real, habilita YouTube Data API v3 en Google Cloud y configura una
clave restringida a esa API. Para validar análisis, configura
`OPENAI_API_KEY` únicamente en el servidor.
