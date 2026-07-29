---
name: Crealy
description: Un espacio de producción visual directo, oscuro y preciso.
colors:
  brand: "#DDF527"
  brand-hover: "#E6F94F"
  brand-ink: "#111400"
  background: "#080808"
  surface-soft: "#0D0E0B"
  surface: "#11120E"
  surface-elevated: "#191A15"
  foreground: "#F7F7F5"
  muted: "#B0B1AA"
  border: "rgba(255, 255, 255, 0.10)"
typography:
  display:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "clamp(2.75rem, 8vw, 6rem)"
    fontWeight: 600
    lineHeight: 0.94
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.12em"
rounded:
  control: "0.7rem"
  panel: "0.8rem"
  canvas: "1rem"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  section: "7rem"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.brand-ink}"
    rounded: "{rounded.control}"
    padding: "0 1.75rem"
    height: "3rem"
  button-secondary:
    backgroundColor: "rgba(255, 255, 255, 0.025)"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "0 1.75rem"
    height: "3rem"
  product-preview:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.canvas}"
    padding: "1.25rem"
---

# Design System: Crealy

## Overview

**Creative North Star: “La mesa de pruebas creativas”**

Crealy toma el lenguaje de una mesa de producción justo antes de publicar: superficies oscuras que permiten juzgar el contenido, piezas visuales alineadas como pruebas y una señal lima que marca la selección lista para avanzar. La interfaz muestra una ruta corta desde una intención escrita hasta varias piezas posibles.

La identidad combina precisión editorial con velocidad cotidiana. Debe sentirse útil para una persona creadora y suficientemente ordenada para quien gestiona contenido de un negocio.

**Key Characteristics:**

- Composición centrada con aire generoso y jerarquía inmediata.
- Superficies oscuras y mate que ceden el protagonismo al contenido.
- Verde lima reservado para acción, selección y estado listo.
- Miniaturas abstractas que demuestran variedad sin prometer resultados reales.
- Movimiento editorial continuo en el hero y transiciones breves en controles.

## Colors

La paleta utiliza negros cálidos y grises minerales con una única señal lima de alta visibilidad.

- **Cinta Crealy** (`#DDF527`): acción primaria e indicadores activos.
- **Negro de estudio** (`#080808`): fondo principal.
- **Transición de estudio** (`#0D0E0B`): secciones que necesitan una pausa tonal.
- **Mesa de trabajo** (`#11120E`): paneles de producto.
- **Prueba elevada** (`#191A15`): superficies secundarias.
- **Papel luminoso** (`#F7F7F5`): texto principal.
- **Grafito auxiliar** (`#A3A3A3`): texto secundario.
- **Línea de corte** (`rgba(255, 255, 255, 0.10)`): divisiones discretas.

**The Ready Signal Rule.** El verde significa que algo puede iniciarse, seleccionarse o confirmarse; nunca rellena superficies sin función.

**The One Lime Field Rule.** Solo debe existir un campo lima dominante dentro del viewport, normalmente la acción primaria.

## Typography

Geist Sans sostiene titulares, cuerpo y controles. Geist Mono se reserva para formatos, estados y metadatos de producción.

- **Display:** `clamp(2.75rem, 8vw, 6rem)`, peso 600, interlineado 0.94 y tracking `-0.04em`.
- **Body:** 16–18 px, peso 400, interlineado amplio y una medida máxima cercana a 65 caracteres.
- **Label:** 10 px en Geist Mono, tracking `0.12em`; mayúsculas solo para datos operativos.

**The Wide Statement Rule.** Los mensajes principales usan líneas amplias y deliberadas; nunca forman columnas estrechas de palabras.

## Layout

La página usa un contenedor máximo de 1240 px. El menú se centra de forma independiente entre marca y acciones. El hero mantiene tesis, explicación y CTA sobre el eje central. Dos carriles editoriales de miniaturas, posts y portadas recorren el fondo en direcciones opuestas, conservan una zona central oscura para la lectura y convierten el primer viewport en una mesa de publicación viva. La vista de producto se limita a 1152 px.

En móvil, la navegación secundaria desaparece, los CTA se apilan por debajo de 420 px y el panel pasa de dos columnas a una. Todo debe conservar una lectura clara desde 320 px sin desplazamiento horizontal.

## Elevation & Depth

La profundidad nace de capas tonales, bordes blancos de baja opacidad y un único resplandor lima muy difuso alrededor de la vista de producto. Los elementos del fondo pierden contraste mediante una viñeta oscura.

**The Flat Until Useful Rule.** Una superficie permanece plana salvo que la separación ayude a entender jerarquía, interacción o foco.

## Shapes

Los controles usan un radio de `0.7rem`; las piezas de contenido, `0.8rem`; y el lienzo principal, `1rem`. Los bordes son finos y silenciosos. Las píldoras se reservan para indicadores compactos, no para navegación ni texto normal.

## Components

- **Primary Button:** fondo `#DDF527`, texto oscuro, altura de 48 px y elevación de 2 px en hover.
- **Secondary Button:** fondo casi transparente, borde blanco al 18% y contraste mayor en hover.
- **Centered Header:** marca a la izquierda, navegación absolutamente centrada y acciones a la derecha.
- **Kinetic Publishing Wall:** dos carriles continuos de piezas reales en formatos 16:9, 1:1, 4:5 y banner; se mueven en direcciones opuestas, dejan el centro despejado y se vuelven estáticos con `prefers-reduced-motion`.
- **Product Preview:** marco oscuro con prompt estático y tres formatos sociales de muestra; comunica dirección sin simular funcionalidad.
- **Section Reveal:** solo los grupos visuales clave usan entrada por clip o desplazamiento corto; el contenido permanece visible cuando el navegador no soporta scroll-driven animations.

## Do's and Don'ts

### Do:

- **Do** mostrar el proceso creativo mediante contenido y proporciones reconocibles.
- **Do** dejar que una sola acción primaria concentre el color de marca.
- **Do** usar contraste de escala y espacio antes que añadir contenedores.
- **Do** conservar una lectura clara a 320 px y foco visible en cada control.

### Don't:

- **Don't** convertir la interfaz en un paisaje de brillo verde, neón o gradientes.
- **Don't** encerrar cada texto, icono o beneficio en una tarjeta.
- **Don't** fabricar métricas, testimonios, precios o resultados reales.
- **Don't** usar movimiento rápido o parallax que compita con el contenido.
- **Don't** copiar la composición, textos o identidad de Thumbify.
