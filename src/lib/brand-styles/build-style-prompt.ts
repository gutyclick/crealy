import type { BrandStyle, StyleConsistency } from "@/types/brand-style";
import type { ContentType } from "@/types/generation";

const CONSISTENCY = {
  flexible: "Toma la identidad como inspiración flexible; permite adaptar composición y energía al nuevo tema.",
  balanced: "Mantén reconocibles los patrones principales, adaptándolos con naturalidad al nuevo tema.",
  strict: "Conserva con mucha disciplina la paleta, contraste, tratamiento, jerarquía y densidad visual, sin copiar una composición.",
} satisfies Record<StyleConsistency, string>;

export function buildBrandStylePrompt(input: { userPrompt: string; designType: ContentType; brandStyle: Pick<BrandStyle, "name" | "visualSummary" | "visualAttributes">; consistency: StyleConsistency; preset?: string; referenceCount?: number }) {
  const attributes = input.brandStyle.visualAttributes;
  return [
    `Intención principal del usuario (prioridad absoluta): ${input.userPrompt}`,
    `Tipo de diseño: ${input.designType}.`,
    input.preset ? `Preset secundario: ${input.preset}. Si contradice el estilo guardado, prioriza el estilo guardado.` : null,
    `Identidad visual guardada — ${input.brandStyle.name}:`, input.brandStyle.visualSummary,
    attributes ? `Patrones: color ${attributes.colors.join(", ")}; composición ${attributes.composition.join(", ")}; tipografía visual ${attributes.typography.join(", ")}; iluminación ${attributes.lighting.join(", ")}; tratamiento ${attributes.subjects.join(", ")}; efectos ${attributes.effects.join(", ")}; ánimo ${attributes.mood.join(", ")}.` : null,
    `Consistencia: ${CONSISTENCY[input.consistency]}`,
    input.referenceCount ? `Las últimas ${input.referenceCount} imágenes adjuntas son referencias de estilo: extrae únicamente patrones estéticos; no trates su contenido como material que deba aparecer.` : null,
    "Aplica el estilo a la ejecución estética, no al contenido. No reutilices textos, personas, objetos, escenas ni títulos de las referencias.",
    "Crea una composición original, completa y terminada; conserva legibilidad, jerarquía, proporción y reglas de calidad de Crealy.",
  ].filter(Boolean).join("\n");
}
