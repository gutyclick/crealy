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
  const visibleText =
    product.acceptsText && input.primaryText
      ? `Incluye únicamente este texto visible y prioriza su legibilidad: "${input.primaryText}".`
      : "No añadas titulares, palabras, logotipos ni marcas de agua no solicitados.";

  return [
    recreatePrompt,
    `Crea una ${product.fullLabel.toLowerCase()} profesional.`,
    `Salida final: ${variant.width} × ${variant.height}. Variante: ${variant.label}. Calidad: ${input.quality}.`,
    "",
    "Brief:",
    input.description,
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
