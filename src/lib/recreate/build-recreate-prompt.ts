import { getSimilarityInstructions } from "@/lib/recreate/reference";
import type { GenerationInput } from "@/types/generation";

const focusInstructions = {
  composition: "Prioriza la composición, el balance espacial y el recorrido visual de la referencia.",
  subject: "Prioriza la escala, posición y presencia del protagonista, usando únicamente el sujeto aportado por el usuario.",
  text: "Prioriza la fuerza, posición y legibilidad del titular nuevo; nunca copies el texto original.",
  atmosphere: "Prioriza el contraste, la iluminación, la energía y la relación cromática sin calcar la paleta.",
} as const;

const goalInstructions = {
  performance: "Optimiza para detener el scroll y conseguir una lectura inmediata, con un foco dominante y curiosidad clara.",
  clean: "Reduce ruido, simplifica elementos secundarios y aumenta aire y claridad.",
  premium: "Eleva acabado, iluminación, profundidad y control tipográfico con una dirección sofisticada.",
  bold: "Aumenta contraste, escala, tensión visual y energía sin perder legibilidad.",
} as const;

export function buildRecreatePrompt(input: GenerationInput) {
  const blueprint = input.recreateBlueprint;
  if (input.creationMode !== "recreate" || !blueprint) return null;
  const referenceCount = input.referenceUploadIds?.length ?? 0;
  const supportingCount = Math.max(0, referenceCount - 1);
  return [
    "MODO RECREATE — CREA UNA PIEZA NUEVA Y ORIGINAL.",
    "La primera imagen adjunta es una referencia de fórmula visual, no contenido para copiar ni una fuente de identidad.",
    `Objetivo nuevo del usuario: ${input.description}`,
    input.primaryText ? `Texto nuevo permitido: ${input.primaryText}` : "No reproduzcas el texto visible de la referencia.",
    `Categoría y formato de destino: ${input.contentType}, ${input.variant}.`,
    `Composición: ${blueprint.composition}`,
    `Jerarquía: ${blueprint.hierarchy}`,
    `Dirección visual: ${blueprint.visualStyle}`,
    `Fondo: ${blueprint.background}`,
    `Emoción y energía: ${blueprint.emotion}`,
    `Densidad de texto: ${blueprint.textDensity}. Escala del sujeto: ${blueprint.subjectScale}.`,
    `Paleta orientativa: ${blueprint.colorPalette.join(", ") || "extraída de la referencia"}.`,
    `Focos a reinterpretar: ${blueprint.focalElements.join(", ") || "jerarquía principal"}.`,
    `Elementos que deben reemplazarse: ${blueprint.replaceableElements.join(", ") || "texto, personas, logos, marcas y objetos identificables"}.`,
    `Nivel de cercanía: ${getSimilarityInstructions(input.recreateSimilarity ?? "similar")}`,
    `Prioridad a conservar: ${focusInstructions[input.recreateFocus ?? "composition"]}`,
    `Mejora buscada: ${goalInstructions[input.recreateGoal ?? "performance"]}`,
    "REGLAS DE ORIGINALIDAD: nunca copies texto, nombres, logos, branding, una persona, un personaje protegido ni objetos distintivos de la referencia. No hagas una réplica píxel a píxel. Conserva solamente principios abstractos de composición, contraste, ritmo, jerarquía y emoción.",
    supportingCount > 0
      ? `MAPA DE REFERENCIAS: la imagen 1 solo define la fórmula visual. Las imágenes 2 a ${referenceCount} son ${supportingCount} sujetos, productos u objetos aportados por el usuario y deben aparecer en el resultado.`
      : "MAPA DE REFERENCIAS: la imagen 1 solo define la fórmula visual. No copies ni reproduzcas a las personas u objetos identificables que aparezcan en ella.",
    supportingCount > 0
      ? "FIDELIDAD DE SUJETOS: conserva identidad, edad aparente, facciones, tono de piel y rasgos distintivos de cada material adicional. Representa cada sujeto u objeto una sola vez; no mezcles rostros, no fusiones elementos, no los dupliques ni sustituyas uno por otro, salvo petición expresa del usuario."
      : null,
    "CONTROL FINAL: debe leerse como una pieza terminada, original y coherente con el brief; conserva la lógica abstracta de la referencia base, pero cambia el contenido identificable y respeta exactamente el formato de salida.",
  ].filter(Boolean).join("\n");
}
