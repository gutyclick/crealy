import type { RecreateBlueprint, RecreateCategory } from "@/types/recreate";

export function buildFallbackBlueprint(category: RecreateCategory): RecreateBlueprint {
  return {
    category,
    composition: "Usa la primera imagen adjunta para extraer su distribución relativa, balance y patrón de lectura.",
    hierarchy: "Conserva la jerarquía abstracta de la referencia con un foco dominante y lectura inmediata.",
    visualStyle: "Reinterpreta la dirección visual de la referencia sin copiar contenido identificable.",
    background: "Adapta la profundidad, separación y energía del fondo al nuevo contenido.",
    emotion: "Mantén la emoción dominante y el nivel de contraste de la referencia.",
    textDensity: "Equivalente a la referencia, usando únicamente el texto nuevo del usuario.",
    subjectScale: "Equivalente a la referencia, usando únicamente sujetos propios del usuario.",
    colorPalette: [],
    focalElements: ["composición", "jerarquía", "contraste", "patrón de lectura"],
    replaceableElements: ["texto", "personas", "logos", "marcas", "objetos identificables"],
  };
}
