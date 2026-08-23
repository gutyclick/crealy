import "server-only";

import { createHash } from "node:crypto";

import { THUMBNAIL_ARCHETYPES, THUMBNAIL_AVOID, THUMBNAIL_DISTINCTIVENESS_RULES, THUMBNAIL_GLOBAL_RULES, THUMBNAIL_IDENTITY_RULES, THUMBNAIL_NICHES, THUMBNAIL_PRESET_CRAFT, THUMBNAIL_PRESETS } from "@/config/thumbnail-creation";
import { getVisualStyle, resolveAutomaticStyle } from "@/config/visual-styles";
import { getEditingServerEnv } from "@/lib/env/server";
import { getOpenAIClient } from "@/lib/openai/client";
import type { GenerationInput, GenerationReferenceImage, ThumbnailConcept, ThumbnailCreativePlan, ThumbnailEvaluation, ThumbnailNiche } from "@/types/generation";
import { parseResponseUsage, type ProviderUsageObserver } from "@/lib/analytics/provider-cost";
import { deriveAutomaticThumbnailText, isGenericThumbnailText } from "@/lib/generation/derive-thumbnail-text";

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
        mainPromise: { type: "string" }, narrativeContext: { type: "string" },
        eventSummary: { type: "string" }, ordinaryBaseline: { type: "string" },
        anomaly: { type: "string" }, viewerQuestion: { type: "string" },
        causalChain: { type: "string" },
        curiosityGap: { type: "string" }, revealDevice: { type: "string" },
        revealPayoff: { type: "string" }, revealJustification: { type: "string" },
        impactCore: { type: "string" }, stakes: { type: "string" },
        emotionalMechanism: { type: "string" }, emotionalReasoning: { type: "string" },
        visualProof: { type: "string" },
        reactionDirection: { type: "string" }, primaryEmotion: { type: "string" },
        secondaryEmotion: { type: "string" }, mainSubject: { type: "string" },
        supportingObject: { type: "string" }, recommendedText: { type: "string" },
        textPrimaryColor: { type: "string" }, textAccentColor: { type: "string" },
        textColorReason: { type: "string" },
        visualPriority: { type: "string" },
        avoid: { type: "array", items: { type: "string" }, maxItems: 8 },
      },
      required: ["topic", "videoTitle", "niche", "contentType", "audience", "mainPromise", "narrativeContext", "eventSummary", "ordinaryBaseline", "anomaly", "viewerQuestion", "causalChain", "curiosityGap", "revealDevice", "revealPayoff", "revealJustification", "impactCore", "stakes", "emotionalMechanism", "emotionalReasoning", "visualProof", "reactionDirection", "primaryEmotion", "secondaryEmotion", "mainSubject", "supportingObject", "recommendedText", "textPrimaryColor", "textAccentColor", "textColorReason", "visualPriority", "avoid"],
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
    criticalErrors: { type: "array", items: { type: "string", enum: ["incorrect_text", "cropped_text", "deformed_face", "identity_drift", "unrelated_content", "watermark", "unreadable_composition", "wrong_aspect_ratio", "incomplete_image"] }, maxItems: 8 },
    problems: { type: "array", items: { type: "string" }, maxItems: 8 },
    corrections: { type: "array", items: { type: "string" }, maxItems: 8 },
  },
  required: ["approved", "score", "criticalErrors", "problems", "corrections"],
} as const;

function exactThumbnailText(input: GenerationInput, recommended: string) {
  if (input.thumbnailTextMode === "none") return "";
  if (input.thumbnailTextMode === "custom") return input.primaryText?.trim() ?? "";
  const contextual = isGenericThumbnailText(recommended)
    ? deriveAutomaticThumbnailText(input)
    : recommended;
  return contextual.trim().split(/\s+/).slice(0, 5).join(" ");
}

const TEXT_PALETTES = [
  { primary: "blanco puro #FFFFFF", accent: "rojo intenso #F22E2E", reason: "claridad con tensión editorial" },
  { primary: "amarillo cálido #FFD400", accent: "blanco puro #FFFFFF", reason: "energía y lectura inmediata" },
  { primary: "blanco puro #FFFFFF", accent: "verde vivo #38E36F", reason: "descubrimiento, resultado o progreso" },
  { primary: "rojo intenso #F22E2E", accent: "blanco puro #FFFFFF", reason: "urgencia o conflicto real" },
  { primary: "celeste brillante #55D9FF", accent: "blanco puro #FFFFFF", reason: "contraste frío y tecnología" },
] as const;

function fallbackTextPalette(input: GenerationInput) {
  if (input.colorPreference === "custom" && input.customColors?.length) {
    return {
      primary: input.customColors[0],
      accent: input.customColors[1] ?? input.customColors[0],
      reason: "paleta personalizada indicada por el usuario",
    };
  }
  const digest = createHash("sha256")
    .update(`${input.clientRequestId}|text-palette|${input.videoTitle || input.description}`)
    .digest();
  return TEXT_PALETTES[digest[0] % TEXT_PALETTES.length];
}

function resolvedVisualStyle(input: GenerationInput) {
  const selected = input.style === "automatic" || input.style === "auto"
    ? resolveAutomaticStyle({ contentType: input.contentType, description: `${input.videoTitle || ""} ${input.description}` })
    : input.style;
  return getVisualStyle(selected) ?? getVisualStyle("viral")!;
}

const COMPOSITIONS = [
  "primer plano lateral con una revelación en profundidad al lado opuesto",
  "diagonal de tensión entre protagonista y evidencia visual",
  "objeto enorme en primer plano con protagonista reaccionando desde segundo plano",
  "encuadre cenital con una anomalía central y espacio tipográfico lateral",
  "sujeto recortado desde el borde con el resultado dominando el centro óptico",
  "perspectiva sobre el hombro hacia el elemento que resuelve la historia",
] as const;
const LIGHTING = [
  "luz lateral dura y fondo profundo",
  "contraluz recortado con sombras densas",
  "luz de estudio limpia con contraste cromático",
  "fuente motivada dentro de la escena y atmósfera contenida",
] as const;
const TYPE_TREATMENTS = [
  "bloque tipográfico compacto alineado con la mirada del sujeto",
  "texto de gran escala parcialmente detrás del protagonista sin perder legibilidad",
  "titular corto dentro de una forma editorial de alto contraste",
  "tipografía inclinada siguiendo la tensión de la composición",
] as const;

export function thumbnailCreativeSignature(input: GenerationInput) {
  const digest = createHash("sha256")
    .update(`${input.clientRequestId}|${input.description}|${input.videoTitle || ""}|${input.thumbnailPreset || "impactful"}`)
    .digest();
  return [
    `Composición distintiva: ${COMPOSITIONS[digest[0] % COMPOSITIONS.length]}.`,
    `Iluminación: ${LIGHTING[digest[1] % LIGHTING.length]}.`,
    `Tratamiento del texto: ${TYPE_TREATMENTS[digest[2] % TYPE_TREATMENTS.length]}.`,
    `Firma creativa: ${digest.subarray(0, 5).toString("hex")}. No reutilices una plantilla genérica.`,
  ];
}

function buildFinalPrompt(input: GenerationInput, plan: Omit<ThumbnailCreativePlan, "finalPrompt">) {
  const preset = THUMBNAIL_PRESETS.find((item) => item.id === input.thumbnailPreset) ?? THUMBNAIL_PRESETS[0];
  const visualStyle = resolvedVisualStyle(input);
  const text = exactThumbnailText(input, plan.brief.recommendedText);
  return [
    "Create one complete professional YouTube thumbnail as a single finished image in horizontal 16:9 format.",
    "", `Video topic: ${plan.brief.topic}`, `Video title: ${plan.brief.videoTitle || "Not provided"}`,
    `Niche: ${plan.detectedNiche}`, `Creative goal: ${plan.brief.mainPromise}`,
    `Narrative context: ${plan.brief.narrativeContext}`,
    `Literal event: ${plan.brief.eventSummary}`,
    `Ordinary baseline: ${plan.brief.ordinaryBaseline}`,
    `Meaningful anomaly: ${plan.brief.anomaly}`,
    `Viewer's open question: ${plan.brief.viewerQuestion}`,
    `Causal chain: ${plan.brief.causalChain}`,
    `Curiosity gap: ${plan.brief.curiosityGap}`,
    `Reveal device: ${plan.brief.revealDevice}. Expected payoff: ${plan.brief.revealPayoff}. Why it fits: ${plan.brief.revealJustification}`,
    `Click-driving impact core: ${plan.brief.impactCore}. This must be the most immediate visual fact after the face, not background decoration.`,
    `Stakes: ${plan.brief.stakes}`, `Required visual proof: ${plan.brief.visualProof}`,
    `Emotional mechanism: ${plan.brief.emotionalMechanism}. Reasoning: ${plan.brief.emotionalReasoning}`,
    `Primary emotion: ${plan.brief.primaryEmotion}`, `Natural reaction direction: ${plan.brief.reactionDirection}`,
    `Main concept: ${plan.selectedConcept.concept}`,
    `Composition: ${plan.selectedConcept.composition}`, `Main subject: ${plan.selectedConcept.mainSubject}`,
    `Supporting element: ${plan.brief.supportingObject || "none"}`, "",
    input.peopleMode === "none"
      ? "People: render no people, faces, hands, human silhouettes or background figures."
      : input.peopleMode === "uploaded"
        ? `People: show exactly ${input.peopleCount} distinct uploaded ${input.peopleCount === 1 ? "person" : "people"}. Every uploaded face is mandatory. Preserve each identity; never merge, duplicate or add people.`
        : `People: generate exactly ${input.peopleCount} narratively necessary ${input.peopleCount === 1 ? "person" : "people"}. No stock posing, crowds or background faces.`,
    text ? `Thumbnail text: Render exactly "${text}". Do not add any other words, letters, logos, labels, or interface text.` : "Thumbnail text: Do not render any text, letters, logos, labels, or interface elements.",
    "Typography: large, bold, highly readable YouTube thumbnail typography with strong contrast and clean separation from the background.",
    text ? `Text color direction: primary ${plan.brief.textPrimaryColor}; accent ${plan.brief.textAccentColor}. Reason: ${plan.brief.textColorReason}. Use one dominant text color and at most one accent; add a dark outline or shadow only when needed for mobile contrast.` : "",
    text ? input.colorPreference === "custom" && input.customColors?.length
      ? `The text must use only colors from the user's palette: ${input.customColors.join(", ")}. Choose the most legible roles within it.`
      : "Do not default mechanically to white plus yellow. Prefer white, yellow, red or green according to the subject, emotion and actual background; cyan or another color is valid only when it produces a stronger, intentional contrast."
      : "",
    "", `Selected visual style: ${visualStyle.label} — ${visualStyle.description}. This must change the composition, lighting, typography and finish, not merely the color palette.`,
    ...visualStyle.promptGuidelines.map((rule) => `- ${rule}`),
    "", `Visual preset: ${preset.label}. Its visual language is mandatory, not optional.`,
    ...preset.direction.map((rule) => `- ${rule}.`),
    ...THUMBNAIL_PRESET_CRAFT[preset.id].map((rule) => `- ${rule}.`),
    "", "Unique art direction for this generation:", ...thumbnailCreativeSignature(input).map((rule) => `- ${rule}`),
    "", "Mobile readability and global rules:", ...THUMBNAIL_GLOBAL_RULES.map((rule) => `- ${rule}`),
    ...THUMBNAIL_DISTINCTIVENESS_RULES.map((rule) => `- ${rule}`),
    ...(input.peopleMode === "uploaded" ? ["", "Non-negotiable identities for every uploaded person:", ...THUMBNAIL_IDENTITY_RULES.map((rule) => `- ${rule}.`)] : []),
    ...(input.peopleMode !== "uploaded" && input.referenceUploadIds?.length ? ["", "Non-person references are mandatory: preserve each product or object's recognizable geometry, materials, colors and distinguishing details."] : []),
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

function fallbackImpactDirection(input: GenerationInput, impactCore: string) {
  const eventSummary = input.videoTitle?.trim() || input.description.trim();
  return {
    eventSummary,
    ordinaryBaseline: "La versión cotidiana o esperable de la situación descrita",
    anomaly: impactCore,
    viewerQuestion: "Qué ocurrió, qué cambió o cuál fue el resultado concreto de esta situación",
    causalChain: "Situación descrita → elemento extraordinario → consecuencia pendiente de descubrir",
    curiosityGap: "La consecuencia concreta que el espectador todavía no conoce",
    revealDevice: "Revelación parcial localizada sobre la evidencia, sin ocultar el tema principal",
    revealPayoff: "Entender el resultado o consecuencia al ver el video",
    revealJustification: "La ocultación conserva una pregunta específica sin volver genérica la miniatura",
    impactCore,
    stakes: "La consecuencia concreta todavía no resuelta por el título y el brief",
    emotionalMechanism: "curiosidad específica por la consecuencia de la situación",
    emotionalReasoning: "Fallback prudente: no inventar peligro, éxito ni sorpresa; representar el hecho descrito y dejar que su consecuencia sostenga el interés",
    visualProof: `${impactCore} mostrado de forma inequívoca, contextual y conectado con la acción descrita`,
    primaryEmotion: "curiosidad contextual",
    secondaryEmotion: "anticipación",
    reactionDirection: input.peopleMode === "uploaded"
      ? "Expresión natural y contenida coherente con la escena, sin inventar dramatismo ni alterar la identidad"
      : "Una señal visual honesta de la consecuencia, sin imponer una emoción no sustentada",
  };
}

export function buildFallbackThumbnailPlan(input: GenerationInput): ThumbnailCreativePlan {
  const niche = fallbackNiche(`${input.videoTitle || ""} ${input.description}`);
  const textPalette = fallbackTextPalette(input);
  const requestedText =
    input.thumbnailTextMode === "custom"
      ? input.primaryText?.trim() ?? ""
      : input.thumbnailTextMode === "none"
        ? ""
        : deriveAutomaticThumbnailText(input);
  const impact = fallbackImpactDirection(
    input,
    requestedText || input.videoTitle || input.description,
  );
  const concepts: ThumbnailConcept[] = [
    {
      strategy: "clarity",
      archetype: "result",
      concept: `Hacer visible ${impact.impactCore} de forma inmediata y sin elementos innecesarios.`,
      thumbnailText: requestedText,
      mainSubject: input.peopleMode === "uploaded" ? "Cada persona de referencia con identidad distinguible" : "El resultado principal del tema",
      composition: `Protagonista reaccionando en primer plano y ${impact.impactCore} como evidencia visual dominante al lado opuesto.`,
      score: 88,
    },
    {
      strategy: "emotion",
      archetype: "extreme_moment",
      concept: `Representar el instante de máxima ${impact.primaryEmotion} provocado por ${impact.impactCore}.`,
      thumbnailText: requestedText,
      mainSubject: input.peopleMode === "uploaded" ? "Las personas de referencia con expresiones legibles y diferenciadas" : "Un momento narrativo reconocible",
      composition: "Primer plano emocional con un único elemento secundario que explique la situación.",
      score: 82,
    },
    {
      strategy: "curiosity",
      archetype: "curiosity",
      concept: `Revelar suficiente de ${impact.impactCore} para abrir una pregunta visual honesta sin volverlo ambiguo.`,
      thumbnailText: requestedText,
      mainSubject: input.peopleMode === "uploaded" ? "Las personas de referencia relacionadas con el elemento clave" : "El elemento inesperado del tema",
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
    narrativeContext: input.videoTitle || input.description,
    ...impact,
    mainSubject: selectedConcept.mainSubject,
    supportingObject: "Un solo elemento relacionado directamente con el tema",
    recommendedText: requestedText,
    textPrimaryColor: textPalette.primary,
    textAccentColor: textPalette.accent,
    textColorReason: textPalette.reason,
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

export async function planThumbnail(
  input: GenerationInput,
  observe?: ProviderUsageObserver,
): Promise<ThumbnailCreativePlan> {
  const { responsesModel } = getEditingServerEnv();
  const preset = THUMBNAIL_PRESETS.find((item) => item.id === input.thumbnailPreset) ?? THUMBNAIL_PRESETS[0];
  const visualStyle = resolvedVisualStyle(input);
  const startedAt = Date.now();
  let response;
  try {
    response = await getOpenAIClient().responses.create({
    model: responsesModel, store: false, max_output_tokens: 2_800,
    input: [{ role: "user", content: [{ type: "input_text", text: [
      "Actúa como director creativo de miniaturas de YouTube. Devuelve el plan en español.",
      `Tema o idea: ${input.description}`, `Título del video: ${input.videoTitle || "No proporcionado"}`,
      `Preset elegido: ${preset.label} — ${preset.description}`, `Modo de texto: ${input.thumbnailTextMode || "automatic"}`,
      `Estilo visual elegido: ${visualStyle.label} — ${visualStyle.description}`,
      `Preferencia cromática: ${input.colorPreference}${input.customColors?.length ? ` — paleta obligatoria ${input.customColors.join(", ")}` : ""}`,
      input.primaryText ? `Texto exacto del usuario: ${input.primaryText}` : "",
      `Hay referencias del usuario: ${Boolean(input.referenceUploadIds?.length) ? "sí; cada referencia obligatoria debe conservar su identidad o geometría" : "no"}.`,
      `Personas solicitadas: ${input.peopleMode === "none" ? "ninguna" : `${input.peopleCount}, ${input.peopleMode === "uploaded" ? "aportadas por el usuario y de identidad obligatoria" : "generadas por Crealy"}`}. Respeta exactamente esta decisión y no añadas figuras incidentales.`,
      "Dirección creativa exclusiva para esta solicitud:",
      ...thumbnailCreativeSignature(input),
      "Detecta el nicho. Si la confianza es baja usa general. Crea exactamente tres conceptos textuales realmente distintos: claridad, emoción y curiosidad.",
      "Usa un análisis semántico abierto, no una tabla de palabras, temas, nichos, emociones ni ejemplos memorizados. Debe funcionar también con situaciones que nunca hayas visto.",
      "Antes de proponer conceptos, ejecuta esta cadena: (1) resume literalmente qué sucede; (2) establece qué sería lo ordinario en ese contexto; (3) identifica la desviación que vuelve particular la historia; (4) determina qué se puede ganar, perder, descubrir o transformar; (5) formula la pregunta concreta que queda abierta para el espectador; (6) deriva la emoción de esa relación causal; (7) define la evidencia visual que permite entenderla sin leer el título.",
      "RAZONA LA EMOCIÓN, NO LA ASIGNES POR LA FORMA DEL TÍTULO NI POR UNA PALABRA AISLADA. Interpreta conjuntamente acción, sujeto, objeto, modificadores, duración, escala, restricción, contraste, incertidumbre y consecuencia. Explica la cadena causal antes de elegir emoción, reacción o atmósfera.",
      "No uses una taxonomía cerrada. Puedes devolver emociones precisas o combinadas cuando estén justificadas. Si el título es ambiguo, usa el brief; si ambos son ambiguos, conserva incertidumbre o curiosidad honesta en vez de inventar peligro, éxito, escándalo o sorpresa.",
      "Aplica una prueba contrafactual: imagina que cambia el objeto, la acción o la consecuencia manteniendo la misma sintaxis. Si mantendrías automáticamente la misma emoción o composición, tu razonamiento es genérico y debes rehacerlo.",
      "Distingue contexto de detonante: una cifra, duración, lugar o formato puede ser el núcleo solo si realmente cambia el significado. El impacto debe recaer en la relación que hace excepcional este caso, sea cual sea el tema.",
      "Convierte la anomalía y su consecuencia en evidencia visual grande, específica y reconocible. Define qué está en juego y una reacción facial o corporal natural; evita rostros posando, emociones teatrales o elementos que no tengan una función causal en la historia.",
      "Cuando exista una brecha de curiosidad real, diseña una revelación incompleta específica. Puedes usar desenfoque localizado, ocultación parcial, silueta, recorte fuera de cuadro, escala inesperada, contraste antes/después, evidencia interrumpida u otro recurso inventado para este caso. Elige uno por su función narrativa, no por tendencia.",
      "El desenfoque nunca cubre toda la imagen ni sustituye una idea: solo puede ocultar exactamente el resultado, identidad u objeto cuya revelación promete el video. Mantén suficiente evidencia nítida para que tema, riesgo y pregunta se comprendan en móvil.",
      "Si el título ya revela el resultado, no finjas misterio. Sustituye la ocultación por prueba visual, contraste, consecuencia, escala o un instante decisivo. La creatividad debe nacer del significado del video.",
      "Puntúa cada concepto considerando claridad, relevancia, curiosidad, emoción, diferenciación, lectura móvil, facilidad de generación, relación con el título, honestidad y nicho.",
      "En modo automático, resume o destila el título y el tema concretos. Debe nombrar el sujeto, lugar, resultado, cifra, conflicto o beneficio reconocible del video; puede crear urgencia o curiosidad, pero nunca perder el tema.",
      "El texto recomendado debe entenderse sin contexto, tener 2–4 palabras preferiblemente y nunca más de 5. Debe condensar el detonante, resultado, conflicto, beneficio o pregunta específica que tu análisis descubrió; nunca copiar una fórmula reusable.",
      input.colorPreference === "custom" && input.customColors?.length
        ? "Elige color principal y acento exclusivamente dentro de la paleta personalizada del usuario y explica su contraste."
        : "Elige los colores del texto después de razonar sobre fondo, emoción y semántica. Prioriza blanco, amarillo, rojo o verde; usa celeste u otro color solo si supera claramente el contraste. Devuelve color principal, acento y motivo. No elijas siempre blanco y amarillo.",
      "Prohibido devolver ganchos intercambiables como ¿QUÉ PASÓ?, NO LO CREERÁS, INCREÍBLE, IMPACTANTE o TIENES QUE VERLO.",
      "Los tres conceptos deben diferir en metáfora, encuadre, jerarquía, texto y emoción; no son variaciones cosméticas de una plantilla.",
      `Cumple de forma visible el preset ${preset.label}:`,
      ...THUMBNAIL_PRESET_CRAFT[preset.id],
      `Cumple también el estilo ${visualStyle.label}:`,
      ...visualStyle.promptGuidelines,
      ...(input.peopleMode === "uploaded" ? ["La identidad de cada persona es una restricción dura:", ...THUMBNAIL_IDENTITY_RULES] : []),
      ...(input.peopleMode !== "uploaded" && input.referenceUploadIds?.length ? ["Las referencias corresponden a productos u objetos obligatorios: conserva geometría, materiales, colores y rasgos reconocibles sin tratarlos como personas."] : []),
    ].filter(Boolean).join("\n") }] }],
    text: { format: { type: "json_schema", name: "thumbnail_creative_plan", strict: true, schema: planSchema } },
    });
    await observe?.({ operation: "thumbnail_plan", model: responsesModel, providerRequestId: null, usage: parseResponseUsage(response.usage), durationMs: Date.now() - startedAt, succeeded: true, errorCode: null });
  } catch (error) {
    await observe?.({ operation: "thumbnail_plan", model: responsesModel, providerRequestId: null, usage: null, durationMs: Date.now() - startedAt, succeeded: false, errorCode: error instanceof Error ? error.message.slice(0, 120) : "provider_error" });
    throw error;
  }
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

export async function evaluateThumbnail({ buffer, mimeType, input, plan, referenceImages = [], observe, operation = "thumbnail_evaluation" }: { buffer: Buffer; mimeType: string; input: GenerationInput; plan: ThumbnailCreativePlan; referenceImages?: GenerationReferenceImage[]; observe?: ProviderUsageObserver; operation?: string }): Promise<ThumbnailEvaluation> {
  const { responsesModel } = getEditingServerEnv();
  const expectedText = exactThumbnailText(input, plan.brief.recommendedText);
  const startedAt = Date.now();
  let response;
  try {
    response = await getOpenAIClient().responses.create({
    model: responsesModel, store: false, max_output_tokens: 1_200,
    input: [{ role: "user", content: [
      { type: "input_text", text: [
        "Evalúa esta miniatura de YouTube usando solo evidencia visible.",
        `Tema esperado: ${input.description}`, `Texto exacto esperado: ${expectedText || "sin texto"}`,
        `Evento: ${plan.brief.eventSummary}. Base ordinaria: ${plan.brief.ordinaryBaseline}. Anomalía: ${plan.brief.anomaly}. Pregunta abierta: ${plan.brief.viewerQuestion}. Brecha de curiosidad: ${plan.brief.curiosityGap}.`,
        `Recurso de revelación previsto: ${plan.brief.revealDevice}. Resultado prometido: ${plan.brief.revealPayoff}. Justificación: ${plan.brief.revealJustification}.`,
        `Cadena causal: ${plan.brief.causalChain}. Contexto narrativo: ${plan.brief.narrativeContext}. Núcleo de impacto esperado: ${plan.brief.impactCore}. Evidencia visual requerida: ${plan.brief.visualProof}.`,
        `Mecanismo emocional: ${plan.brief.emotionalMechanism}. Emoción: ${plan.brief.primaryEmotion}. Justificación: ${plan.brief.emotionalReasoning}.`,
        `Preset visual obligatorio: ${input.thumbnailPreset || "impactful"}. Verifica que se reconozca claramente y no solo por el color.`,
        `Colores de texto previstos: ${plan.brief.textPrimaryColor} y ${plan.brief.textAccentColor}. Evalúa contraste e intención, no una combinación fija.`,
        referenceImages.length ? "Las primeras imágenes son referencias del usuario y la última es el resultado. Compara el rostro de cada persona: debe ser inequívocamente la misma identidad, aunque la expresión pueda cambiar de forma natural." : "No hay referencias personales para comparar.",
        "Puntuación total: núcleo de impacto y evidencia visual 20, claridad visual 10, calidad técnica 10, texto contextual 15, relevancia 15, emoción y potencial de clic 15, fidelidad al preset y estilo 5, y diferenciación frente a una plantilla genérica 10.",
        "Si el elemento extraordinario del título queda pequeño, secundario, genérico o ausente, marca unrelated_content y no apruebes el resultado.",
        "Si la reacción o atmósfera expresa una emoción que no corresponde semánticamente al título y al brief, no apruebes el resultado.",
        "Comprueba que la imagen representa la cadena evento → anomalía → consecuencia y responde visualmente a la pregunta abierta. Si solo coincide con palabras sueltas, no la apruebes.",
        `Comprueba que aparecen exactamente ${input.peopleCount} personas cuando se solicitaron, o ninguna si se eligió sin personas. Rechaza sujetos extra, omitidos, duplicados o identidades mezcladas.`,
        "Si usa blur u ocultación, debe ser localizado, conservar contexto legible y ocultar únicamente el payoff definido. Rechaza misterio genérico o desenfoque decorativo.",
        "Penaliza texto intercambiable, rostro centrado con glow, fondos abstractos sin relación, flechas gratuitas y composiciones de stock.",
        "Si una cara de referencia cambió de identidad, fue embellecida artificialmente o perdió rasgos reconocibles, añade identity_drift como error crítico.",
        "Marca approved solo con 80+ o con 70–79 sin errores críticos. Con menos de 70 o cualquier error crítico, approved debe ser false.",
      ].join("\n") },
      ...referenceImages.slice(0, 4).map((reference) => ({
        type: "input_image" as const,
        image_url: `data:${reference.mimeType};base64,${reference.buffer.toString("base64")}`,
        detail: "high" as const,
      })),
      { type: "input_image", image_url: `data:${mimeType};base64,${buffer.toString("base64")}`, detail: "high" },
    ] }],
    text: { format: { type: "json_schema", name: "thumbnail_evaluation", strict: true, schema: evaluationSchema } },
    });
    await observe?.({ operation, model: responsesModel, providerRequestId: null, usage: parseResponseUsage(response.usage), durationMs: Date.now() - startedAt, succeeded: true, errorCode: null });
  } catch (error) {
    await observe?.({ operation, model: responsesModel, providerRequestId: null, usage: null, durationMs: Date.now() - startedAt, succeeded: false, errorCode: error instanceof Error ? error.message.slice(0, 120) : "provider_error" });
    throw error;
  }
  if (response.status !== "completed" || !response.output_text) throw new Error("thumbnail_evaluation_incomplete");
  return JSON.parse(response.output_text) as ThumbnailEvaluation;
}

export function buildCorrectiveThumbnailPrompt(plan: ThumbnailCreativePlan, evaluation: ThumbnailEvaluation) {
  return [
    "Regenerate the complete thumbnail as one finished image while preserving the core concept.", "", plan.finalPrompt, "",
    "Correct these observed problems:", ...(evaluation.problems.length ? evaluation.problems : evaluation.criticalErrors).map((problem) => `- ${problem}`),
    "", "Required corrections:", ...evaluation.corrections.map((correction) => `- ${correction}`),
    ...(evaluation.criticalErrors.includes("identity_drift") ? ["Identity correction is mandatory: restore the exact person from the uploaded reference. Preserve facial geometry, skin texture and recognizable traits; change only the requested natural expression and scene lighting."] : []),
    "Do not repeat the defects. Return one final 16:9 thumbnail only.",
  ].join("\n");
}
