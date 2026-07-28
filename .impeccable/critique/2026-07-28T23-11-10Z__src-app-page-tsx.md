---
target: landing de Crealy
total_score: 20
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
timestamp: 2026-07-28T23-11-10Z
slug: src-app-page-tsx
---
⚠️ DEGRADED: single-context (Assessment A completed independently; Assessment B sub-agent stalled and the detector fallback ran in the parent context)

# Auditoría de diseño — Landing de Crealy

## Design Health Score

| # | Heurística | Puntuación | Hallazgo principal |
|---|---|---:|---|
| 1 | Visibilidad del estado | 3/4 | La demo se marca como conceptual, pero los CTA comunican disponibilidad inmediata. |
| 2 | Correspondencia con el mundo real | 3/4 | Lenguaje claro; “tokens” no se explica y el flujo aparece como tres y cinco pasos. |
| 3 | Control y libertad | 3/4 | Navegación clara; el menú móvil no contempla Escape ni cierre por pérdida de foco. |
| 4 | Consistencia y estándares | 2/4 | “Empezar a crear”, “Crear gratis”, “Probar 7 días” y “novedades” describen ofertas distintas. |
| 5 | Prevención de errores | 1/4 | Se promocionan generación, prueba y prestaciones todavía no disponibles. |
| 6 | Reconocimiento sobre recuerdo | 3/4 | Los formatos son reconocibles; el visitante debe inferir cuánto vale un token. |
| 7 | Flexibilidad y eficiencia | n/a | No aplica a esta superficie Persuade. |
| 8 | Diseño estético y minimalista | 3/4 | Base limpia y coherente, pero nueve secciones reiteran ideas similares. |
| 9 | Recuperación de errores | 2/4 | La aclaración de disponibilidad llega tarde en FAQ y disclaimers secundarios. |
| 10 | Ayuda y documentación | n/a | No aplica; la FAQ cubre objeciones básicas. |
| **Total** | | **20/32** | **Aceptable; buena base con problemas de promesa, prueba y orden.** |

## Veredicto de especificidad

La dirección “mesa de pruebas creativas” es visible en las cintas del hero, la demostración y la galería. Sin embargo, el conjunto todavía resulta intercambiable con una SaaS de IA: fondo negro, Geist, lima, tarjetas fotográficas y titulares como “llama la atención” o “destacar”. La reutilización de las mismas imágenes en tres secciones reduce la sensación de variedad y producto real.

El detector determinista devolvió cero hallazgos para `src/app/page.tsx`. Esto no invalida los problemas distribuidos entre componentes, copy y configuración que requieren juicio humano. La inspección visual se apoyó en capturas existentes de desktop y móvil; no hubo overlay inyectado.

## Color

- `#DDF527` es distintivo, legible y debe mantenerse como señal de acción, selección y estado listo.
- Contrastes calculados: foreground `#F7F7F5` sobre `#080808` = 18.67:1; muted `#A3A3A3` = 7.94:1; brand `#DDF527` = 16.37:1; brand ink sobre brand = 15.27:1.
- `text-white/38` sobre `#080808` queda en 3.49:1 y falla AA para texto pequeño. `white/42` también queda bajo 4.5:1.
- Los niveles `#080808`, `#101010` y `#151515` son demasiado próximos en una página larga; varias secciones se funden.
- Casi todas las imágenes repiten negro y lima. Esto hace fuerte la marca, pero comunica poca amplitud creativa.
- Pricing concentra badge, ahorro, iconos, borde y CTA lima en un solo viewport, debilitando la regla de un único campo dominante.

## Impresión general

El hero tiene presencia, la demo explica el concepto y la página se siente cuidada. El mayor problema no es estético: la landing muestra demasiadas variaciones de la misma prueba y solicita compromiso antes de haber demostrado suficiente valor. La verdad sobre el estado del producto aparece demasiado tarde.

## Qué funciona

- Jerarquía tipográfica sólida, composición centrada y buen uso del espacio.
- Relato visual coherente desde miniaturas animadas hacia la demostración y los ejemplos.
- Buenas bases de accesibilidad: semántica, textos alternativos, foco visible y reducción de movimiento.
- La paleta oscura permite que el contenido y la acción principal destaquen.

## Problemas prioritarios

### P1 — CTA y disponibilidad no coinciden

“Empezar a crear”, “Crear gratis” y “Probar gratis 7 días” prometen generación, créditos y facturación que todavía no existen. Cambiar la conversión a una acción que sí pueda completarse y hacer visible “Producto en desarrollo” desde el hero.

### P1 — Pricing aparece antes de la mejor prueba

El orden solicita comparar planes antes de mostrar la galería completa. Mover ejemplos y demostración antes de precios. Si los precios continúan siendo provisionales, titular “Planes previstos para el lanzamiento”.

### P1 — Evidencia visual repetida

`ProductPreview`, tipos de contenido y ejemplos reutilizan el mismo material. Crear casos distintos con estructura entrada → formato/canal → resultado conceptual y mostrar adaptación de una misma campaña a varios formatos.

### P2 — Arquitectura demasiado larga

Tipos de contenido y ejemplos se solapan; cómo funciona y comparación repiten el proceso. Integrar cada pareja y reducir la landing de nueve bloques principales a seis o siete.

### P2 — Copy genérico y modelo mental inconsistente

“Contenido que llama la atención” no expresa la ventaja específica. Unificar el proceso en tres pasos: Elige formato → Describe → Revisa y descarga. Explicar qué compra un token o cambiar el pricing a una unidad más comprensible.

### P2 — Contraste y táctil móvil

Los disclaimers importantes en `white/38` no alcanzan AA y el botón del menú móvil mide 40×40 px. Subir avisos críticos a 13–14 px con al menos `white/48` y controles a 44×44 px.

## Carga cognitiva

Moderada. El primer viewport presenta cuatro enlaces, inicio de sesión, CTA de header y dos CTA de hero. Pricing exige comparar ciclo, precio, tokens mensuales, tokens de prueba y features sin explicar el valor de un token. La coexistencia de un proceso de tres pasos y otro de cinco añade fricción.

## Viaje emocional

El hero crea curiosidad y la demo entrega comprensión. Luego la página entra en un valle de repetición. Pricing llega antes del pico de prueba; Examples recupera deseo demasiado tarde. La FAQ revela que el producto no está disponible y el CTA final vuelve a prometer creación inmediata. El final debería cerrar con una acción honesta y realizable.

## Personas

- **Jordan, primera vez:** entiende los formatos, pero toma literalmente “Empezar a crear” y no comprende “tokens”.
- **Riley, stress tester:** detectará prestaciones y prueba no disponibles, además de la contradicción entre tres y cinco pasos.
- **Casey, móvil:** debe recorrer una página extensa con secciones similares; el control del menú queda bajo 44 px.
- **Marina, community manager:** necesita ver cómo una idea se adapta coherentemente a varias plataformas; la galería actual no lo demuestra.

## Estructura recomendada

1. Header con tres anclas y una sola acción.
2. Hero con estado del producto, propuesta específica y CTA realizable.
3. Demostración input → decisiones → tres resultados.
4. Casos de uso por audiencia y objetivo; incorporar aquí los formatos.
5. Proceso breve y diferenciación, integrando la comparación.
6. Planes previstos, después de demostrar valor.
7. FAQ compacta.
8. CTA final coherente con el estado real.

Eliminar como secciones independientes la cuadrícula extensa de tipos y la comparación genérica; su contenido útil debe integrarse en casos de uso y proceso.

## Qué añadir

- Una demostración de “una idea, varios formatos” para probar la ventaja central.
- Contexto visible en cada ejemplo: prompt, audiencia, canal y proporción.
- Un bloque corto “Disponible ahora / Próximamente” antes de pricing.
- Reaseguro cerca de conversión: estado de prueba, cancelación y uso comercial, solo cuando sean hechos reales.
- Diversidad cromática dentro de las piezas generadas, manteniendo la UI neutral.

## Preguntas de dirección

- ¿La conversión real hoy es crear una cuenta, pedir acceso o ver la demo?
- ¿La promesa central es generar una imagen o convertir una campaña en varios formatos?
- ¿Los precios provisionales ayudan a validar intención o reducen confianza?
