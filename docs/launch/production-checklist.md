# Checklist de producción

Estado objetivo: **beta privada**. Marca cada punto con evidencia antes de invitar usuarios.

## Infraestructura

- [ ] Dominio `www.crealy.app` conectado a Vercel y redirección desde el dominio raíz verificada.
- [ ] Variables de Production cargadas y `npm run validate:production-env` aprobado en un entorno seguro.
- [ ] Migraciones remotas coinciden con `supabase migration list`.

### Vercel

- [ ] Production y Preview usan credenciales/proyectos separados; cron, logs, alertas, Analytics y Speed Insights tienen decisión explícita.
- [ ] HTTPS, canonical, `NEXT_PUBLIC_SITE_URL` y `NEXT_PUBLIC_CANONICAL_HOST` coinciden.

### Supabase

- [ ] Proyecto de producción, RLS, backups/PITR según plan, pooling, rate limits y Auth revisados.
- [ ] URLs de redirección incluyen producción y únicamente previews autorizados.
- [ ] SMTP personalizado contiene host, puerto, usuario, contraseña, From y Reply-to copiados del proveedor, sin guardarlos en Git.
- [ ] Alta, recuperación, cambio de correo, reautenticación y avisos de seguridad probados.

### OpenAI

- [ ] Clave de proyecto, presupuesto, rate limits, modelo, calidad alta/2K y moderación comprobados.
- [ ] Los logs no contienen prompts, imágenes ni respuestas completas.

### Stripe

- [ ] Modo correcto, productos/Price IDs, webhook, Portal, branding e impuestos revisados.
- [ ] Checkout, renovación, pago fallido, cancelación y una prueba live controlada aprobados.

### Cloudflare R2

- [ ] Bucket privado, CORS, lifecycle, claves limitadas, presigned uploads y retención verificados.
- [ ] Política de recuperación documentada; inventario reconciliable con `assets`.

### Resend y DNS

- [ ] Dominio, SPF y DKIM muestran verificación; DMARC se desplegará gradualmente según el proveedor.
- [ ] Remitente, webhook, bounces, complaints y plantillas probados sin inventar valores DNS.

### Google Cloud / YouTube

- [ ] API key restringida por API/origen, cuota y facturación revisadas; si no se usa lookup, la función permanece desactivada.

## Producto y seguridad

- [ ] `npm run check:secrets`, `lint`, `typecheck`, `test` y `build` aprobados.
- [ ] E2E y `npm run smoke:production -- https://www.crealy.app` aprobados.
- [ ] Registro/invitaciones, onboarding, creación, edición, descarga y facturación probados con una cuenta nueva.
- [ ] Desactivar generación, edición, cobros y correo mediante flags fue ensayado.
- [ ] Cabeceras CSP/HSTS, robots, sitemap, Open Graph, 404 y error boundary revisados.
- [ ] Alertas de jobs, Stripe, almacenamiento y gasto de OpenAI tienen responsable.

## Negocio y cumplimiento

- [ ] Nombre legal, jurisdicción, contacto, retención y reembolsos sustituyen los placeholders.
- [ ] Revisión legal externa completada antes del lanzamiento público.
- [x] Analytics y Speed Insights están activados mediante flags y limitados a eventos sin contenido sensible.
- [ ] Canal y horario de soporte publicados.
- [ ] Lista inicial de invitados y criterios de salida de beta aprobados.

Si un punto crítico falla, no se amplía el acceso. Sigue
[`rollback.md`](rollback.md) si el problema apareció después de desplegar.
