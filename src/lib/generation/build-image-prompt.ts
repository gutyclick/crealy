import "server-only";

import { getContentFormat, getPlatformCover } from "@/config/content-formats";
import { GENERATION_COLORS, getContentTypeConfig } from "@/config/generation";
import {
  getVisualStyle,
  resolveAutomaticStyle,
} from "@/config/visual-styles";
import type { GenerationInput } from "@/types/generation";

function palettePrompt(input: GenerationInput) {
  if (input.colorPreference !== "custom" || !input.customColors?.length) {
    const label =
      GENERATION_COLORS.find((item) => item.id === input.colorPreference)?.label ??
      "Automático";
    return `Dirección de color: ${label}.`;
  }
  const [primary, secondary, ...accents] = input.customColors;
  return [
    "Paleta visual:",
    `- Principal: ${primary}.`,
    ...(secondary ? [`- Secundario: ${secondary}.`] : []),
    ...(accents.length ? [`- Acentos: ${accents.join(", ")}.`] : []),
    "- Respeta su jerarquía y conserva contraste suficiente; pueden existir variaciones mínimas de renderizado.",
  ].join("\n");
}

export function buildImagePrompt(input: GenerationInput) {
  const type = getContentTypeConfig(input.contentType);
  const format = getContentFormat(input.format);
  const platform =
    input.contentType === "social-cover" && input.coverPlatform
      ? getPlatformCover(input.coverPlatform)
      : null;
  const resolvedStyle =
    input.style === "automatic" || input.style === "auto"
      ? resolveAutomaticStyle(input)
      : input.style;
  const style = getVisualStyle(resolvedStyle);
  const visibleText = input.primaryText
    ? `Incluye este texto visible y prioriza su legibilidad: "${input.primaryText}".`
    : "No añadas titulares, palabras, logotipos ni marcas de agua no solicitados.";

  return [
    `Crea una ${type.fullLabel.toLowerCase()} profesional${platform ? ` para ${platform.label}` : ""}.`,
    `Resolución de salida solicitada: ${format.exportWidth} × ${format.exportHeight}.`,
    "",
    "Brief:",
    input.description,
    "",
    "Composición:",
    ...(platform?.promptGuidelines ?? [
      "Mantén una jerarquía visual clara.",
      "Conserva los elementos esenciales dentro del área segura.",
    ]).map((guideline) => `- ${guideline}`),
    "- Evita detalles diminutos, elementos cortados y fondos confusos.",
    "- No incluyas marcas o personajes conocidos.",
    "",
    `Estilo ${style?.label ?? "Profesional"}:`,
    ...(style?.promptGuidelines ?? ["Composición limpia y equilibrada."]).map(
      (guideline) => `- ${guideline}`,
    ),
    "",
    palettePrompt(input),
    "",
    "Texto:",
    visibleText,
    ...(input.referenceUploadIds?.length
      ? [
          "",
          "Referencias:",
          "- Integra solo los elementos relevantes.",
          "- Conserva identidad, edad aparente, rasgos, geometría, materiales y colores de personas u objetos; no los modifiques salvo petición explícita.",
        ]
      : []),
    "",
    "Entrega una sola pieza terminada, sin mockup, marcos ni explicación.",
  ].join("\n");
}

