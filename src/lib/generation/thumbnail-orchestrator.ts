import "server-only";

import { THUMBNAIL_ARCHETYPES, THUMBNAIL_AVOID, THUMBNAIL_GLOBAL_RULES, THUMBNAIL_NICHES, THUMBNAIL_PRESETS } from "@/config/thumbnail-creation";
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
  return recommended.trim().split(/\s+/).slice(0, 5).join(" ");
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
    "", `Visual preset: ${preset.label}.`, ...preset.direction.map((rule) => `- ${rule}.`),
    "", "Mobile readability and global rules:", ...THUMBNAIL_GLOBAL_RULES.map((rule) => `- ${rule}`),
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
  const niche = fallbackNiche(input.description);
  const requestedText =
    input.thumbnailTextMode === "custom"
      ? input.primaryText?.trim() ?? ""
      : input.thumbnailTextMode === "none"
        ? ""
        : "¿QUÉ PASÓ?";
  const concepts: ThumbnailConcept[] = [
    {
      strategy: "clarity",
      archetype: "result",
      concept: "Mostrar el resultado principal de forma inmediata y sin elementos innecesarios.",
      thumbnailText: requestedText,
      mainSubject: input.referenceUploadIds?.length ? "La persona de referencia como protagonista" : "El resultado principal del tema",
      composition: "Sujeto dominante en primer plano, resultado visible al lado opuesto y fondo simple.",
      score: 88,
    },
    {
      strategy: "emotion",
      archetype: "extreme_moment",
      concept: "Representar el momento de mayor tensión o sorpresa relacionado con el tema.",
      thumbnailText: requestedText,
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
      "Detecta el nicho. Si la confianza es baja usa general. Crea exactamente tres conceptos textuales realmente distintos: claridad, emoción y curiosidad.",
      "Puntúa cada concepto considerando claridad, relevancia, curiosidad, emoción, diferenciación, lectura móvil, facilidad de generación, relación con el título, honestidad y nicho.",
      "El texto recomendado debe complementar el título, tener 1–4 palabras preferiblemente y nunca más de 5.",
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
        "Puntuación total: claridad visual 20, calidad técnica 20, texto 20, relevancia 15, potencial de clic visual 15 y legibilidad móvil 10.",
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
