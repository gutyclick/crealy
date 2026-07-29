import "server-only";

import {
  GENERATION_COLORS,
  GENERATION_STYLES,
  getContentTypeConfig,
  getFormatConfig,
} from "@/config/generation";
import type { GenerationInput } from "@/types/generation";

const TYPE_DIRECTIONS: Record<GenerationInput["contentType"], string> = {
  "youtube-thumbnail":
    "Prioriza impacto inmediato, un punto focal claro y lectura efectiva a tamaño pequeño.",
  "social-post":
    "Crea una composición clara para el feed, con jerarquía visual y un sujeto reconocible.",
  banner:
    "Distribuye los elementos de forma horizontal y reserva espacio negativo para el mensaje principal.",
  "social-cover":
    "Construye una escena panorámica equilibrada que conserve legibilidad en recortes responsivos.",
};

function getOptionLabel<T extends string>(
  options: ReadonlyArray<{ id: T; label: string }>,
  id: T,
) {
  return options.find((option) => option.id === id)?.label ?? id;
}

export function buildImagePrompt(input: GenerationInput) {
  const type = getContentTypeConfig(input.contentType);
  const format = getFormatConfig(input.format);
  const style = getOptionLabel(GENERATION_STYLES, input.style);
  const colors =
    input.colorPreference === "custom"
      ? input.customColors?.join(" y ")
      : getOptionLabel(GENERATION_COLORS, input.colorPreference);

  const visibleText = input.primaryText
    ? `Incluye exactamente este texto visible: "${input.primaryText}". Dale espacio suficiente y prioriza su legibilidad, aceptando que la tipografía generada puede presentar variaciones menores.`
    : "No añadas titulares, palabras, logotipos ni marcas de agua que no hayan sido solicitados.";

  return [
    `Crea una ${type.fullLabel.toLowerCase()} profesional.`,
    "",
    "Objetivo de la pieza:",
    TYPE_DIRECTIONS[input.contentType],
    "",
    "Brief del usuario:",
    input.description,
    "",
    "Dirección visual:",
    `- Formato solicitado: ${format.label}.`,
    `- Estilo: ${style}.`,
    `- Preferencia de color: ${colors || "Automático"}.`,
    "- Jerarquía visual clara y sujeto principal bien definido.",
    "- Composición limpia, moderna y preparada para publicación.",
    "- Contraste suficiente entre sujeto, fondo y texto.",
    "- Evita detalles diminutos, elementos cortados y fondos confusos.",
    "- No añadas marcas, firmas ni logotipos no solicitados.",
    "",
    "Texto:",
    visibleText,
    "",
    "Entrega una única pieza terminada, sin mockups, marcos de dispositivo ni explicaciones alrededor.",
  ].join("\n");
}
