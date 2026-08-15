import {
  RECREATE_PRESERVATION_OPTIONS,
  RECREATE_REFERENCE_ROLES,
} from "@/config/recreate";
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

const preservationInstructions = {
  composition: "conserva la distribución relativa, jerarquía, balance y recorrido visual",
  pose: "conserva el gesto, la dirección corporal y la relación espacial de la pose sin copiar la identidad de la referencia base",
  lighting: "conserva dirección, dureza, contraste y profundidad de la iluminación",
  colors: "conserva las familias cromáticas y sus proporciones, adaptándolas al contenido nuevo",
  typography: "conserva escala, peso, densidad y ubicación tipográfica, pero nunca el texto, la fuente de una marca ni sus rasgos identificables",
} as const;

export function buildRecreatePrompt(input: GenerationInput) {
  const blueprint = input.recreateBlueprint;
  if (input.creationMode !== "recreate" || !blueprint) return null;
  const referenceCount = input.referenceUploadIds?.length ?? 0;
  const supportingCount = Math.max(0, referenceCount - 1);
  const roleLines = Array.from({ length: supportingCount }, (_, index) => {
    const roleId = input.recreateReferenceRoles?.[index] ??
      (index === 0 ? "protagonist" : "supporting");
    const role = RECREATE_REFERENCE_ROLES.find((item) => item.id === roleId) ??
      RECREATE_REFERENCE_ROLES.at(-1)!;
    const analysis = input.recreateElementAnalyses?.[index];
    const faceRule = analysis?.faceCount
      ? ` Contiene ${analysis.faceCount} ${analysis.faceCount === 1 ? "rostro" : "rostros"} que deben conservar facciones y apariencia visible.`
      : "";
    const anchors = analysis?.identityAnchors.length
      ? ` Rasgos que deben permanecer: ${analysis.identityAnchors.join(", ")}.`
      : "";
    return [
      `Imagen ${index + 2}: ${role.prompt}.`,
      analysis
        ? `Elemento reconocido: ${analysis.primarySubject}. Tipo: ${analysis.kind}. ${analysis.placementGuidance}`
        : "Analiza visualmente el elemento antes de integrarlo.",
      faceRule,
      anchors,
    ].filter(Boolean).join(" ");
  });
  const selectedPreservation = input.recreatePreservation
    ? RECREATE_PRESERVATION_OPTIONS
        .filter((item) => input.recreatePreservation?.[item.id])
        .map((item) => preservationInstructions[item.id])
    : [];
  return [
    "MODO RECREATE — RECONSTRUCCIÓN ESTRUCTURAL ESTRICTA CON CONTENIDO NUEVO.",
    "La primera imagen adjunta es el plano visual obligatorio. Conserva su idea, distribución, jerarquía, escala relativa, dirección de lectura, zonas de texto, profundidad y tensión visual.",
    "Antes de generar, identifica los espacios funcionales de la referencia base. Sustituye cada espacio solo por un elemento propio compatible: persona por persona, producto por producto, fondo por fondo y apoyo por apoyo.",
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
    input.recreatePreservation
      ? selectedPreservation.length
        ? `CONSERVACIÓN SOLICITADA:\n${selectedPreservation.map((rule) => `- ${rule}.`).join("\n")}`
        : "CONSERVACIÓN SOLICITADA: reinterpreta libremente composición, pose, iluminación, colores y tratamiento tipográfico."
      : `Prioridad a conservar: ${focusInstructions[input.recreateFocus ?? "composition"]}`,
    `Mejora buscada: ${goalInstructions[input.recreateGoal ?? "performance"]}`,
    "REGLAS DE ORIGINALIDAD: nunca copies texto, nombres, logos, branding, identidad de una persona ni personajes protegidos presentes únicamente en la referencia base. No hagas una réplica píxel a píxel; reconstruye la estructura con el contenido aportado por el usuario.",
    supportingCount > 0
      ? `MAPA DE REFERENCIAS: la imagen 1 define la estructura visual obligatoria. Las imágenes 2 a ${referenceCount} son ${supportingCount} elementos aportados por el usuario y todos deben aparecer exactamente una vez en el resultado.`
      : "MAPA DE REFERENCIAS: la imagen 1 solo define la fórmula visual. No copies ni reproduzcas a las personas u objetos identificables que aparezcan en ella.",
    ...roleLines,
    supportingCount > 0
      ? "FIDELIDAD DE ELEMENTOS: conserva facciones, expresión reconocible, peinado, vestuario y rasgos visibles de cada persona; conserva geometría, proporciones, color, material y detalles de cada objeto o producto. No mezcles rostros, no fusiones elementos, no los dupliques ni sustituyas uno por otro."
      : null,
    supportingCount > 0
      ? "PROHIBIDO INVENTAR ELEMENTOS: no añadas personas, personajes, productos, mascotas, accesorios ni objetos protagonistas que no estén en los materiales propios o en el brief. Si falta material para ocupar un espacio de la referencia, simplifica ese espacio en vez de rellenarlo al azar."
      : "PROHIBIDO INVENTAR PROTAGONISTAS: no reproduzcas los sujetos de la referencia ni añadas personajes u objetos principales sin respaldo en el brief.",
    "CONTROL FINAL: compara mentalmente el resultado con la referencia base. La estructura, proporciones y lectura deben reconocerse de inmediato; el contenido identificable debe provenir del usuario y el formato de salida debe respetarse exactamente.",
  ].filter(Boolean).join("\n");
}
