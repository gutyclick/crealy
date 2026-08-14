# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Creadores de contenido, emprendedores, dueños de pequeños negocios y community managers que necesitan producir piezas visuales para sus canales digitales sin dominar herramientas profesionales de diseño.

## Product Purpose

Crealy convierte ideas en contenido visual mediante una experiencia sencilla y rápida asistida por inteligencia artificial. El producto busca que una persona pueda llegar a un resultado útil sin conocimientos de diseño y sin la complejidad de una suite creativa tradicional.

## Positioning

Una ruta directa desde la intención del usuario hasta una pieza visual lista para utilizar, con menos decisiones, herramientas y fricción que un editor de diseño generalista.

## Operating Context

El producto se usará para preparar contenido visual destinado a redes sociales y canales digitales. Sus usuarios alternan esta tarea con la gestión diaria de contenido, campañas, comunidades y negocios, por lo que valoran la velocidad, la claridad y resultados que requieran poca edición manual.

## Capabilities and Constraints

- La Fase 4 incorpora generación real de una imagen por solicitud mediante OpenAI Image API.
- La creación admite hasta cuatro imágenes privadas de referencia —personas,
  productos, objetos o dirección visual— y prioriza preservar identidad y
  rasgos distintivos salvo que el brief solicite cambios.
- La Fase 5 incorpora edición conversacional mediante OpenAI Responses API:
  permite partir de una generación o de un PNG/JPEG/WebP propio, pedir cambios
  localizados, comparar resultados y restaurar cualquier versión como nueva
  base.
- La oferta comercial presenta Gratis, Starter, Creator y Pro con periodos
  mensual y anual. Checkout exige un Price ID real para cada combinación.
- La Fase 3 incorpora autenticación real con Supabase, confirmación de correo, recuperación de contraseña, perfil básico y un dashboard privado protegido.
- Los proyectos, generaciones e imágenes privadas persisten en PostgreSQL y Supabase Storage con RLS.
- Las sesiones, mensajes, uploads y versiones se conservan de forma privada con
  RLS, URLs firmadas, relaciones padre-hijo y archivado reversible.
- Generación y edición consumen créditos mediante reservas y movimientos
  atómicos. La cuenta recibe créditos de bienvenida una sola vez.
- Stripe Checkout gestiona el alta de Pro; Customer Portal administra cobro y
  cancelación; webhooks firmados sincronizan suscripción y créditos mensuales.
- Se conserva una sola operación activa por usuario y un máximo configurable
  de versiones por sesión como medidas operativas.
- La edición manual por capas, máscaras, canvas, colaboración y sharing público
  siguen fuera de alcance.
- La arquitectura debe permitir crecimiento por fases sin anticipar abstracciones o servicios que todavía no existen.

## Brand Commitments

- Nombre: Crealy.
- Idioma inicial: español.
- Voz directa, clara y sin promesas exageradas.
- Color principal obligatorio: `#DDF527`, utilizado con moderación.
- Thumbify, Pikzels y SaaS contemporáneas de inteligencia artificial funcionan como referencias generales, no como plantillas para copiar.
- La experiencia debe sentirse moderna, minimalista, premium, tecnológica y fácil de entender.

## Evidence on Hand

No existen todavía testimonios, clientes, métricas ni casos de estudio. Los
precios publicados son $0, $5, $15 y $40 al mes; los periodos anuales son $48,
$144 y $384. No se fabrican testimonios, temporizadores ni urgencia.

## Product Principles

1. Reducir decisiones antes que añadir funciones.
2. Mostrar el resultado esperado con más claridad que la tecnología que lo produce.
3. Mantener una ruta breve desde la idea hasta la pieza visual.
4. Servir por igual a creadores independientes y a personas que producen contenido para un negocio.
5. Crecer por fases sin comprometer la simplicidad del MVP.

## Accessibility & Inclusion

La interfaz debe funcionar con teclado, mantener foco visible y contraste suficiente, respetar preferencias de movimiento reducido y adaptarse desde aproximadamente 320 px hasta pantallas grandes.

## Launch Operations

- La etapa inicial es beta privada, con invitaciones habilitadas por defecto en
  producción y ampliación gradual por cohortes.
- El onboarding tiene tres pasos opcionales y personaliza accesos sin consumir
  créditos ni decidir permisos, seguridad o facturación.
- Los correos de producto se envían con Resend mediante jobs idempotentes; los
  correos de seguridad y autenticación permanecen en Supabase Auth.
- Soporte y feedback nunca adjuntan automáticamente prompts o imágenes. Las
  solicitudes anónimas conservan únicamente el contacto necesario para poder
  responder.
- Vercel Analytics y Speed Insights se activan mediante flags en los entornos desplegados; sus eventos excluyen contenido sensible
  y consentimiento; sus eventos no incluyen contenido del usuario.
- Las páginas legales son borradores no indexables hasta completar entidad,
  jurisdicción, fechas y revisión profesional.
- La definición de activación es una generación o edición completada.
