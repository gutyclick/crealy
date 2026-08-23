import "server-only";

import {
  getGenerationProduct,
  getGenerationVariant,
} from "@/config/generation-products";
import { GENERATION_COLORS } from "@/config/generation";
import { getVisualStyle, resolveAutomaticStyle } from "@/config/visual-styles";
import type { GenerationInput } from "@/types/generation";
import { buildRecreatePrompt } from "@/lib/recreate/build-recreate-prompt";

function palettePrompt(input: GenerationInput) {
  if (input.colorPreference !== "custom" || !input.customColors?.length) {
    return `Dirección de color: ${
      GENERATION_COLORS.find((item) => item.id === input.colorPreference)?.label ??
      "Automático"
    }.`;
  }
  return [
    "Paleta solicitada, en orden de prioridad:",
    ...input.customColors.map((color, index) => `- ${index + 1}: ${color}.`),
    "- Conserva contraste suficiente; admite solo variaciones mínimas de renderizado.",
  ].join("\n");
}

function productGuidelines(input: GenerationInput) {
  switch (input.contentType) {
    case "thumbnail":
      return [
        "Debe funcionar como miniatura de YouTube a tamaño pequeño.",
        "Usa un foco dominante, silueta clara y máximo tres grupos visuales.",
        "Si hay rostro, conserva expresión legible sin deformar identidad.",
      ];
    case "social-post":
      return [
        "Diseña una pieza de feed, no una captura de una interfaz.",
        "La lectura debe ser inmediata en móvil.",
      ];
    case "banner":
      return [
        "Construye una composición panorámica adaptable.",
        "Reserva espacio negativo real para el mensaje principal.",
      ];
    case "social-cover":
      return [
        `Es una portada de ${input.platform}; no una publicación ni un mockup.`,
        "Extiende el fondo de forma natural fuera del área segura.",
      ];
    case "story":
      return [
        `Es una historia vertical para ${input.platform}.`,
        "Respeta una composición 9:16 y evita las zonas ocupadas por controles de la aplicación.",
        input.showSafeArea
          ? "Mantén todo texto y rostro dentro de la zona segura central."
          : "Mantén los elementos esenciales alejados de los extremos.",
      ];
    case "profile-image":
      return [
        `Crea un avatar para ${input.platform}.`,
        `Modo: ${input.profileMode}; intensidad de transformación: ${input.profileIntensity}; fondo: ${input.profileBackground}.`,
        "Entrega un máster cuadrado que también funcione recortado como círculo.",
        "FIDELIDAD OBLIGATORIA: conserva identidad, edad aparente, rasgos faciales, tono de piel, proporciones, logotipo, geometría y colores del material de referencia.",
        "No embellezcas, rejuvenezcas, cambies género, etnia, peinado ni expresión salvo petición explícita.",
      ];
  }
}

function peoplePrompt(input: GenerationInput) {
  if (input.peopleMode === "none") {
    return "PERSONAS: no incluyas personas, rostros, manos, siluetas humanas ni figuras incidentales en el fondo.";
  }
  if (input.peopleMode === "uploaded") {
    return [
      `PERSONAS PROPIAS: deben aparecer exactamente ${input.peopleCount}.`,
      "Cada imagen de referencia corresponde a una persona distinta y obligatoria.",
      "Conserva identidad, geometría facial, edad aparente, tono y rasgos reconocibles; puedes ajustar expresión, pose e iluminación sin convertirla en otra persona.",
      "No mezcles identidades, no dupliques sujetos y no añadas personas de relleno.",
    ].join(" ");
  }
  return [
    `PERSONAS GENERADAS: crea exactamente ${input.peopleCount} ${input.peopleCount === 1 ? "persona" : "personas"} coherentes con el brief.`,
    "Dales una función narrativa concreta, expresiones distintas y posiciones legibles; no uses modelos de stock posando.",
    "No añadas rostros, multitudes ni siluetas humanas adicionales en el fondo.",
  ].join(" ");
}

const visibleTextLanguageRules = [
  "Escribe con ortografía correcta, acentos, puntuación y uso natural de mayúsculas en el idioma del brief.",
  "Respeta la grafía oficial de marcas inequívocamente conocidas cuando aparezcan en el brief; por ejemplo: WhatsApp, YouTube, Instagram, LinkedIn, TikTok, OpenAI y ChatGPT.",
  "No autocorrijas nombres propios, marcas locales, productos, usuarios o términos dudosos. Si no tienes certeza, conserva exactamente la grafía proporcionada por el usuario.",
  "Conserva sin cambios teléfonos, precios, fechas, direcciones, nombres legales, identificadores, @usuarios y URLs.",
  "No inventes nombres, cifras, servicios, resultados, credenciales, promociones ni datos de contacto.",
] as const;

function visibleTextPrompt(input: GenerationInput, textMode: GenerationInput["textMode"]) {
  if (textMode === "custom" && input.primaryText) {
    return [
      `Incluye únicamente este mensaje visible: "${input.primaryText}". No añadas ninguna otra frase.`,
      "Conserva las palabras y los datos aportados; corrige únicamente ortografía común inequívoca y la grafía oficial de una marca ampliamente conocida.",
      ...visibleTextLanguageRules,
    ].join(" ");
  }

  if (textMode === "automatic") {
    const copyDirection = input.contentType === "social-post"
      ? [
          "Redacta el texto visible automáticamente a partir de la descripción del usuario.",
          "Selecciona solo la información esencial y conviértela en una pieza clara para Instagram: un titular preciso y, solo si aporta valor, una línea de apoyo o llamada a la acción.",
          "Si el brief es escaso, crea un titular corto y útil sobre su tema central; no rellenes los vacíos con hechos, beneficios, servicios o datos de contacto inventados.",
          "Puedes reorganizar y resumir la redacción, pero todos los datos concretos del resultado deben estar respaldados por el brief.",
        ]
      : [
          "Crea un único texto visible breve a partir del brief.",
          "Resume la idea concreta; no inventes un gancho genérico ni repitas todo el brief.",
          "Hazlo legible en el formato final y no añadas texto secundario, logos ni marcas de agua.",
        ];

    return [...copyDirection, ...visibleTextLanguageRules].join(" ");
  }

  return "SALIDA SIN TEXTO: no dibujes letras, palabras, números, titulares, etiquetas, logotipos, marcas de agua ni caracteres decorativos. Comunica el brief únicamente con la imagen.";
}

export function buildImagePrompt(input: GenerationInput) {
  const recreatePrompt = buildRecreatePrompt(input);
  const product = getGenerationProduct(input.contentType);
  const variant = getGenerationVariant(input.variant);
  if (!variant) throw new Error("invalid_generation_variant");
  const resolvedStyle =
    input.style === "automatic" || input.style === "auto"
      ? resolveAutomaticStyle(input)
      : input.style;
  const style = getVisualStyle(resolvedStyle);
  const textMode = product.acceptsText
    ? input.textMode ?? input.thumbnailTextMode ?? "none"
    : "none";
  const visibleText = visibleTextPrompt(input, textMode);

  return [
    recreatePrompt,
    `Crea una ${product.fullLabel.toLowerCase()} profesional.`,
    `Salida final: ${variant.width} × ${variant.height}. Variante: ${variant.label}. Calidad: ${input.quality}.`,
    "",
    "Brief:",
    input.description,
    "",
    peoplePrompt(input),
    "",
    "Reglas del producto:",
    ...productGuidelines(input).map((line) => `- ${line}`),
    ...variant.promptGuidelines.map((line) => `- ${line}`),
    "- Evita detalles diminutos, elementos cortados, marcas conocidas y fondos confusos.",
    "",
    `Dirección visual — ${style?.label ?? "Profesional"}:`,
    ...(style?.promptGuidelines ?? ["Composición limpia y equilibrada."]).map(
      (line) => `- ${line}`,
    ),
    "",
    palettePrompt(input),
    "",
    "Texto:",
    visibleText,
    ...(input.referenceUploadIds?.length
      ? [
          "",
          "Material de referencia:",
          "- Integra solo lo relevante para el brief.",
          "- La referencia tiene prioridad sobre cualquier inferencia estética.",
          "- No modifiques personas, objetos, logotipos ni rasgos salvo petición explícita del usuario.",
        ]
      : []),
    "",
    "Entrega una sola pieza terminada, sin mockup, marcos, etiquetas técnicas ni explicación.",
  ].join("\n");
}
