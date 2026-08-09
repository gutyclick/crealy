import "server-only";

import { createHash } from "node:crypto";

import { THUMBNAIL_ARCHETYPES, THUMBNAIL_AVOID, THUMBNAIL_DISTINCTIVENESS_RULES, THUMBNAIL_GLOBAL_RULES, THUMBNAIL_NICHES, THUMBNAIL_PRESET_CRAFT, THUMBNAIL_PRESETS } from "@/config/thumbnail-creation";
import { getEditingServerEnv } from "@/lib/env/server";
import { getOpenAIClient } from "@/lib/openai/client";
import type { GenerationInput, ThumbnailConcept, ThumbnailCreativePlan, ThumbnailEvaluation, ThumbnailNiche } from "@/types/generation";

const conceptSchema = {
  type: "object", additionalProperties: false,
  properties: {
    strategy: { type: "string", enum: ["clarity", "emotion", "curiosity"] },
    archetype: { type: "string", enum: THUMBNAIL_ARCHETYPES.map((item) => item.id) },
    concept: { type: "string" }, thumbnailText: { type: "string" },
    mainSubject: { type: "string" }, composition: { type: "string" },
    score: { type: "integer", minimum: 0, maximum: 100 },
  },
  required: ["strategy", "archetype", "concept", "thumbnailText", "mainSubject", "composition", "score"],
} as const;

const planSchema = {
  type: "object", additionalProperties: false,
  properties: {
    detectedNiche: { type: "string", enum: THUMBNAIL_NICHES.map((item) => item.id) },
    nicheConfidence: { type: "number", minimum: 0, maximum: 1 },
    brief: {
      type: "object", additionalProperties: false,
      properties: {
        topic: { type: "string" }, videoTitle: { type: "string" },
        niche: { type: "string", enum: THUMBNAIL_NICHES.map((item) => item.id) },
        contentType: { type: "string" }, audience: { type: "string" },
        mainPromise: { type: "string" }, primaryEmotion: { type: "string" },
        secondaryEmotion: { type: "string" }, mainSubject: { type: "string" },
        supportingObject: { type: "string" }, recommendedText: { type: "string" },
        visualPriority: { type: "string" },
        avoid: { type: "array", items: { type: "string" }, maxItems: 8 },
      },
      required: ["topic", "videoTitle", "niche", "contentType", "audience", "mainPromise", "primaryEmotion", "secondaryEmotion", "mainSubject", "supportingObject", "recommendedText", "visualPriority", "avoid"],
    },
    concepts: { type: "array", items: conceptSchema, minItems: 3, maxItems: 3 },
    selectedConceptIndex: { type: "integer", minimum: 0, maximum: 2 },
  },
  required: ["detectedNiche", "nicheConfidence", "brief", "concepts", "selectedConceptIndex"],
} as const;

const evaluationSchema = {
  type: "object", additionalProperties: false,
  properties: {
    approved: { type: "boolean" }, score: { type: "integer", minimum: 0, maximum: 100 },
    criticalErrors: { type: "array", items: { type: "string", enum: ["incorrect_text", "cropped_text", "deformed_face", "unrelated_content", "watermark", "unreadable_composition", "wrong_aspect_ratio", "incomplete_image"] }, maxItems: 8 },
    problems: { type: "array", items: { type: "string" }, maxItems: 8 },
    corrections: { type: "array", items: { type: "string" }, maxItems: 8 },
  },
  required: ["approved", "score", "criticalErrors", "problems", "corrections"],
} as const;

function exactThumbnailText(input: GenerationInput, recommended: string) {
  if (input.thumbnailTextMode === "none") return "";
  if (input.thumbnailTextMode === "custom") return input.primaryText?.trim() ?? "";
  const normalized = recommended.trim().replace(/[Â¿?Â¡!]/g, "").toLocaleUpperCase("es");
  const genericHooks = ["QUÃ‰ PASÃ“", "NO LO CREERÃ�S", "INCREÃ�BLE", "IMPACTANTE", "TIENES QUE VERLO"];
  const contextual = genericHooks.some((hook) => normalized === hook)
    ? deriveAutomaticThumbnailText(input)
    : recommended;
  return contextual.trim().split(/\s+/).slice(0, 5).join(" ");
}

const AUTOMATIC_TEXT_STOP_WORDS = new Set([
  "a", "al", "algo", "como", "con", "de", "del", "el", "en", "es",
  "esta", "este", "esto", "la", "las", "lo", "los", "mi", "para",
  "por", "que", "se", "sin", "su", "sus", "te", "tu", "un", "una",
  "video", "youtube", "y",
]);

function textTokens(value: string) {
  return value
    .replace(/[Â¿?Â¡!.,:;()[\]{}"']/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function deriveAutomaticThumbnailText(input: GenerationInput) {
  const source = `${input.videoTitle?.trim() || ""} ${input.description}`.trim();
  const meaningful = textTokens(source).filter((token) => {
    const normalized = token
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return /\d/.test(token) || (normalized.length > 2 && !AUTOMATIC_TEXT_STOP_WORDS.has(normalized));
  });
  const unique = meaningful.filter(
    (token, index) =>
      meaningful.findIndex((candidate) => candidate.toLowerCase() === token.toLowerCase()) === index,
  );
  const selected = unique.slice(0, 4);
  if (selected.length) return selected.join(" ").toLocaleUpperCase("es");

  const fallback = textTokens(source).slice(0, 3).join(" ");
  return fallback.toLocaleUpperCase("es") || "TU IDEA";
}

const COMPOSITIONS = [
  "primer plano lateral con una revelaciÃ³n en profundidad al lado opuesto",
  "diagonal de tensiÃ³n entre protagonista y evidencia visual",
  "objeto enorme en primer plano con protagonista reaccionando desde segundo plano",
  "encuadre cenital con una anomalÃ­a central y espacio tipogrÃ¡fico lateral",
  "sujeto recortado desde el borde con el resultado dominando el centro Ã³ptico",
  "perspectiva sobre el hombro hacia el elemento que resuelve la historia",
] as const;
const LIGHTING = [
  "luz lateral dura y fondo profundo",
  "contraluz recortado con sombras densas",
  "luz de estudio limpia con contraste cromÃ¡tico",
  "fuente motivada dentro de la escena y atmÃ³sfera contenida",
] as const;
const TYPE_TREATMENTS = [
  "bloque tipogrÃ¡fico compacto alineado con la mirada del sujeto",
  "texto de gran escala parcialmente detrÃ¡s del protagonista sin perder legibilidad",
  "titular corto dentro de una forma editorial de alto contraste",
  "tipografÃ­a inclinada siguiendo la tensiÃ³n de la composiciÃ³n",
] as const;

export function thumbnailCreativeSignature(input: GenerationInput) {
  const digest = createHash("sha256")
    .update(`${input.clientRequestId}|${input.description}|${input.videoTitle || ""}|${input.thumbnailPreset || "impactful"}`)
    .digest();
  return [
    `ComposiciÃ³n distintiva: ${COMPOSITIONS[digest[0] % COMPOSITIONS.length]}.`,
    `IluminaciÃ³n: ${LIGHTING[digest[1] % LIGHTING.length]}.`,
    `Tratamiento del texto: ${TYPE_TREATMENTS[digest[2] % TYPE_TREATMENTS.length]}.`,
    `Firma creativa: ${digest.subarray(0, 5).toString("hex")}. No reutilices una plantilla genÃ©rica.`,
  ];
}

function buildFinalPrompt(input: GenerationInput, plan: Omit<ThumbnailCreativePlan, "finalPrompt">) {
  const preset = THUMBNAIL_PRESETS.find((item) => item.id === input.thumbnailPreset) ?? THUMBNAIL_PRESETS[0];
  const text = exactThumbnailText(input, plan.brief.recommendedText);
  return [
    "Create one complete professional YouTube thumbnail as a single finished image in horizontal 16:9 format.",
    "", `Video topic: ${plan.brief.topic}`, `Video title: ${plan.brief.videoTitle || "Not provided"}`,
    `Niche: ${plan.detectedNiche}`, `Creative goal: ${plan.brief.mainPromise}`,
    `Primary emotion: ${plan.brief.primaryEmotion}`, `Main concept: ${plan.selectedConcept.concept}`,
    `Composition: ${plan.selectedConcept.composition}`, `Main subject: ${plan.selectedConcept.mainSubject}`,
    `Supporting element: ${plan.brief.supportingObject || "none"}`, "",
    text ? `Thumbnail text: Render exactly "${text}". Do not add any other words, letters, logos, labels, or interface text.` : "Thumbnail text: Do not render any text, letters, logos, labels, or interface elements.",
    "Typography: large, bold, highly readable YouTube thumbnail typography with strong contrast and clean separation from the background.",
    "", `Visual preset: ${preset.label}. Its visual language is mandatory, not optional.`,
    ...preset.direction.map((rule) => `- ${rule}.`),
    ...THUMBNAIL_PRESET_CRAFT[preset.id].map((rule) => `- ${rule}.`),
    "", "Unique art direction for this generation:", ...thumbnailCreativeSignature(input).map((rule) => `- ${rule}`),
    "", "Mobile readability and global rules:", ...THUMBNAIL_GLOBAL_RULES.map((rule) => `- ${rule}`),
    ...THUMBNAIL_DISTINCTIVENESS_RULES.map((rule) => `- ${rule}`),
    "", "The entire thumbnail must be generated as one complete image, ready to publish. Do not create a mockup or separate layers.",
    `Avoid: ${[...THUMBNAIL_AVOID, ...plan.brief.avoid].join(", ")}.`,
  ].join("\n");
}

function fallbackNiche(topic: string): ThumbnailNiche {
  const value = topic.toLowerCase();
  if (/(ia|inteligencia artificial|chatgpt|tecnolog|software|app)/.test(value)) return "technology_ai";
  if (/(dinero|finanza|negocio|venta|inversi|empresa)/.test(value)) return "finance_business";
  if (/(juego|gaming|gamer|playstation|xbox|nintendo)/.test(value)) return "gaming";
  if (/(tutorial|curso|aprend|enseñ|educa)/.test(value)) return "education";
  if (/(productiv|hábito|organiza|tiempo)/.test(value)) return "productivity";
  if (/(fitness|salud|gym|entrena|peso)/.test(value)) return "fitness_health";
  if (/(viaje|turismo|hotel|vuelo|país)/.test(value)) return "travel";
  if (/(belleza|maquillaje|moda|estilo de vida)/.test(value)) return "beauty_lifestyle";
  if (/(noticia|reacci|actualidad|última hora)/.test(value)) return "reactions_news";
  if (/(historia|entretenimiento|celebridad|película)/.test(value)) return "entertainment";
  return "general";
}

export function buildFallbackThumbnailPlan(input: GenerationInput): ThumbnailCreativePlan {
  const niche = fallbackNiche(`${input.videoTitle || ""} ${input.description}`);
  const requestedText =
    input.thumbnailTextMode === "custom"
      ? input.primaryText?.trim() ?? ""
      : input.thumbnailTextMode === "none"
        ? ""
        : deriveAutomaticThumbnailText(input);
  const concepts: ThumbnailConcept[] = [
    {
      strategy: "clarity",
      archetype: "result",
      concept: "Mostrar el resultado principal de forma inmediata y sin elementos innecesarios.",
      thumbnailText: input.thumbnailTextMode === "automatic"
        ? deriveAutomaticThumbnailText({ ...input, videoTitle: `${input.videoTitle || input.description} momento decisivo` })
        : requestedText,
      mainSubject: input.referenceUploadIds?.length ? "La persona de referencia como protagonista" : "El resultado principal del tema",
      composition: "Sujeto dominante en primer plano, resultado visible al lado opuesto y fondo simple.",
      score: 88,
    },
    {
      strategy: "emotion",
      archetype: "extreme_moment",
      concept: "Representar el momento de mayor tensión o sorpresa relacionado con el tema.",
      thumbnailText: input.thumbnailTextMode === "automatic"
        ? deriveAutomaticThumbnailText({ ...input, videoTitle: `${input.videoTitle || input.description} clave oculta` })
        : requestedText,
      mainSubject: input.referenceUploadIds?.length ? "La persona de referencia con expresión legible" : "Un momento narrativo reconocible",
      composition: "Primer plano emocional con un único elemento secundario que explique la situación.",
      score: 82,
    },
    {
      strategy: "curiosity",
      archetype: "curiosity",
      concept: "Insinuar la respuesta sin revelarla por completo para abrir una pregunta visual honesta.",
      thumbnailText: requestedText,
      mainSubject: input.referenceUploadIds?.length ? "La persona de referencia observando el elemento clave" : "El elemento inesperado del tema",
      composition: "Foco principal grande, elemento parcialmente revelado y espacio limpio para el texto.",
      score: 80,
    },
  ];
  const selectedConcept = concepts[0];
  const brief = {
    topic: input.description,
    videoTitle: input.videoTitle ?? "",
    niche,
    contentType: "Miniatura de YouTube",
    audience: "Audiencia interesada en el tema del video",
    mainPromise: "Comunicar el valor central del video en menos de un segundo",
    primaryEmotion: input.thumbnailPreset === "curiosity" ? "curiosidad" : "interés",
    secondaryEmotion: "confianza",
    mainSubject: selectedConcept.mainSubject,
    supportingObject: "Un solo elemento relacionado directamente con el tema",
    recommendedText: requestedText,
    visualPriority: "Sujeto, resultado y texto en ese orden",
    avoid: [...THUMBNAIL_AVOID],
  };
  const planWithoutPrompt = {
    detectedNiche: niche,
    nicheConfidence: niche === "general" ? 0.35 : 0.72,
    brief,
    concepts,
    selectedConcept,
  };
  return { ...planWithoutPrompt, finalPrompt: buildFinalPrompt(input, planWithoutPrompt) };
}

export async function planThumbnail(input: GenerationInput): Promise<ThumbnailCreativePlan> {
  const { responsesModel } = getEditingServerEnv();
  const preset = THUMBNAIL_PRESETS.find((item) => item.id === input.thumbnailPreset) ?? THUMBNAIL_PRESETS[0];
  const response = await getOpenAIClient().responses.create({
    model: responsesModel, store: false, max_output_tokens: 2_800,
    input: [{ role: "user", content: [{ type: "input_text", text: [
      "Actúa como director creativo de miniaturas de YouTube. Devuelve el plan en español.",
      `Tema o idea: ${input.description}`, `Título del video: ${input.videoTitle || "No proporcionado"}`,
      `Preset elegido: ${preset.label} — ${preset.description}`, `Modo de texto: ${input.thumbnailTextMode || "automatic"}`,
      input.primaryText ? `Texto exacto del usuario: ${input.primaryText}` : "",
      `Hay foto del usuario: ${Boolean(input.referenceUploadIds?.length) ? "sí; debe ser el único protagonista y conservar su identidad" : "no; decide si hace falta una persona"}.`,
      "Dirección creativa exclusiva para esta solicitud:",
      ...thumbnailCreativeSignature(input),
      "Detecta el nicho. Si la confianza es baja usa general. Crea exactamente tres conceptos textuales realmente distintos: claridad, emoción y curiosidad.",
      "Puntúa cada concepto considerando claridad, relevancia, curiosidad, emoción, diferenciación, lectura móvil, facilidad de generación, relación con el título, honestidad y nicho.",
      "En modo automático, deriva cada texto del título y del tema concretos. Debe nombrar un resultado, objeto, cifra, conflicto o beneficio reconocible del video.",
      "El texto recomendado debe complementar el título, no repetirlo literalmente, tener 1–4 palabras preferiblemente y nunca más de 5.",
      "Prohibido devolver ganchos intercambiables como ¿QUÉ PASÓ?, NO LO CREERÁS, INCREÍBLE, IMPACTANTE o TIENES QUE VERLO.",
      "Los tres conceptos deben diferir en metáfora, encuadre, jerarquía, texto y emoción; no son variaciones cosméticas de una plantilla.",
      `Cumple de forma visible el preset ${preset.label}:`,
      ...THUMBNAIL_PRESET_CRAFT[preset.id],
    ].filter(Boolean).join("\n") }] }],
    text: { format: { type: "json_schema", name: "thumbnail_creative_plan", strict: true, schema: planSchema } },
  });
  if (response.status !== "completed" || !response.output_text) throw new Error("thumbnail_plan_incomplete");
  const parsed = JSON.parse(response.output_text) as { detectedNiche: ThumbnailNiche; nicheConfidence: number; brief: ThumbnailCreativePlan["brief"]; concepts: ThumbnailConcept[]; selectedConceptIndex: number };
  const selectedConcept = [...parsed.concepts].sort((a, b) => b.score - a.score)[0]
    ?? parsed.concepts[parsed.selectedConceptIndex]
    ?? parsed.concepts[0];
  const detectedNiche = parsed.nicheConfidence < 0.45 ? "general" as const : parsed.detectedNiche;
  const planWithoutPrompt = {
    detectedNiche,
    nicheConfidence: parsed.nicheConfidence,
    brief: {
      ...parsed.brief,
      niche: detectedNiche,
      recommendedText: selectedConcept.thumbnailText,
    },
    concepts: parsed.concepts,
    selectedConcept,
  };
  return { ...planWithoutPrompt, finalPrompt: buildFinalPrompt(input, planWithoutPrompt) };
}

export async function evaluateThumbnail({ buffer, mimeType, input, plan }: { buffer: Buffer; mimeType: string; input: GenerationInput; plan: ThumbnailCreativePlan }): Promise<ThumbnailEvaluation> {
  const { responsesModel } = getEditingServerEnv();
  const expectedText = exactThumbnailText(input, plan.brief.recommendedText);
  const response = await getOpenAIClient().responses.create({
    model: responsesModel, store: false, max_output_tokens: 1_200,
    input: [{ role: "user", content: [
      { type: "input_text", text: [
        "Evalúa esta miniatura de YouTube usando solo evidencia visible.",
        `Tema esperado: ${input.description}`, `Texto exacto esperado: ${expectedText || "sin texto"}`,
        `Preset visual obligatorio: ${input.thumbnailPreset || "impactful"}. Verifica que se reconozca claramente y no solo por el color.`,
        "Puntuación total: claridad visual 15, calidad técnica 15, texto contextual 20, relevancia 15, potencial de clic visual 15, fidelidad al preset 10 y diferenciación frente a una plantilla genérica 10.",
        "Penaliza texto intercambiable, rostro centrado con glow, fondos abstractos sin relación, flechas gratuitas y composiciones de stock.",
        "Marca approved solo con 80+ o con 70–79 sin errores críticos. Con menos de 70 o cualquier error crítico, approved debe ser false.",
      ].join("\n") },
      { type: "input_image", image_url: `data:${mimeType};base64,${buffer.toString("base64")}`, detail: "high" },
    ] }],
    text: { format: { type: "json_schema", name: "thumbnail_evaluation", strict: true, schema: evaluationSchema } },
  });
  if (response.status !== "completed" || !response.output_text) throw new Error("thumbnail_evaluation_incomplete");
  return JSON.parse(response.output_text) as ThumbnailEvaluation;
}

export function buildCorrectiveThumbnailPrompt(plan: ThumbnailCreativePlan, evaluation: ThumbnailEvaluation) {
  return [
    "Regenerate the complete thumbnail as one finished image while preserving the core concept.", "", plan.finalPrompt, "",
    "Correct these observed problems:", ...(evaluation.problems.length ? evaluation.problems : evaluation.criticalErrors).map((problem) => `- ${problem}`),
    "", "Required corrections:", ...evaluation.corrections.map((correction) => `- ${correction}`),
    "Do not repeat the defects. Return one final 16:9 thumbnail only.",
  ].join("\n");
}
