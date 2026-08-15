import "server-only";

import { RECREATE_REFERENCE_ROLES } from "@/config/recreate";
import { getEditingServerEnv } from "@/lib/env/server";
import { getOpenAIClient } from "@/lib/openai/client";
import type { GenerationInput, GenerationReferenceImage } from "@/types/generation";
import type {
  RecreateEvaluation,
  RecreateEvaluationCriticalError,
} from "@/types/recreate";
import { parseResponseUsage, type ProviderUsageObserver } from "@/lib/analytics/provider-cost";

const CRITICAL_ERRORS = [
  "missing_subject",
  "duplicated_subject",
  "identity_drift",
  "incorrect_text",
  "unreadable_text",
  "composition_mismatch",
  "wrong_format",
  "incomplete_image",
  "watermark",
] as const satisfies readonly RecreateEvaluationCriticalError[];

const evaluationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    approved: { type: "boolean" },
    score: { type: "integer", minimum: 0, maximum: 100 },
    identityScore: { type: "integer", minimum: 0, maximum: 100 },
    compositionScore: { type: "integer", minimum: 0, maximum: 100 },
    textScore: { type: "integer", minimum: 0, maximum: 100 },
    criticalErrors: {
      type: "array",
      items: { type: "string", enum: CRITICAL_ERRORS },
      maxItems: CRITICAL_ERRORS.length,
    },
    problems: { type: "array", items: { type: "string" }, maxItems: 8 },
    corrections: { type: "array", items: { type: "string" }, maxItems: 8 },
  },
  required: [
    "approved",
    "score",
    "identityScore",
    "compositionScore",
    "textScore",
    "criticalErrors",
    "problems",
    "corrections",
  ],
} as const;

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function roleSummary(input: GenerationInput) {
  return (input.recreateReferenceRoles ?? []).map((roleId, index) => {
    const role = RECREATE_REFERENCE_ROLES.find((item) => item.id === roleId);
    const analysis = input.recreateElementAnalyses?.[index];
    return `Imagen ${index + 3}: ${role?.label ?? "Secundario"}${analysis ? `; ${analysis.primarySubject}; rostros esperados: ${analysis.faceCount}` : ""}`;
  });
}

export async function evaluateRecreate({
  buffer,
  mimeType,
  input,
  references,
  observe,
  operation = "recreate_evaluation",
}: {
  buffer: Buffer;
  mimeType: string;
  input: GenerationInput;
  references: GenerationReferenceImage[];
  observe?: ProviderUsageObserver;
  operation?: string;
}): Promise<RecreateEvaluation> {
  const { responsesModel } = getEditingServerEnv();
  const supportingCount = Math.max(0, references.length - 1);
  const startedAt = Date.now();
  let response;
  try {
    response = await getOpenAIClient().responses.create({
    model: responsesModel,
    store: false,
    max_output_tokens: 1_400,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              "Evalúa el resultado de Recreate usando únicamente evidencia visible.",
              "Orden de imágenes: imagen 1 = resultado generado; imagen 2 = referencia base de composición; las demás son materiales propios que deben incorporarse.",
              `Brief: ${input.description}`,
              `Texto exacto solicitado: ${input.primaryText?.trim() || "sin texto visible"}`,
              `Materiales propios esperados: ${supportingCount}.`,
              ...roleSummary(input),
              "Evalúa identidad solo contra las imágenes propias, nunca contra la persona de la referencia base. Comprueba cada rostro de forma independiente y penaliza mezclas de facciones.",
              "Evalúa composición con criterio estricto: deben coincidir zonas, posiciones relativas, escala, recortes, pose, dirección de lectura, espacio negativo y relaciones de profundidad de la referencia base, aunque el contenido sea nuevo.",
              "No aceptes personas, personajes, productos u objetos protagonistas inventados que no estén en el brief o en los materiales propios.",
              "Marca missing_subject si falta un material propio solicitado; duplicated_subject si aparece repetido; identity_drift si una persona o producto perdió rasgos distintivos.",
              "Marca incorrect_text o unreadable_text si el texto exacto no coincide o no se lee. Si no se solicitó texto, cualquier palabra añadida cuenta como incorrect_text.",
              "Marca composition_mismatch si la idea visual o la distribución ya no se reconocen con claridad. approved requiere 84+ y ningún error crítico. Devuelve correcciones específicas y ejecutables.",
            ].join("\n"),
          },
          {
            type: "input_image",
            image_url: `data:${mimeType};base64,${buffer.toString("base64")}`,
            detail: "high",
          },
          ...references.map((reference) => ({
            type: "input_image" as const,
            image_url: `data:${reference.mimeType};base64,${reference.buffer.toString("base64")}`,
            detail: "low" as const,
          })),
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "recreate_evaluation",
        strict: true,
        schema: evaluationSchema,
      },
    },
    });
    await observe?.({ operation, model: responsesModel, providerRequestId: null, usage: parseResponseUsage(response.usage), durationMs: Date.now() - startedAt, succeeded: true, errorCode: null });
  } catch (error) {
    await observe?.({ operation, model: responsesModel, providerRequestId: null, usage: null, durationMs: Date.now() - startedAt, succeeded: false, errorCode: error instanceof Error ? error.message.slice(0, 120) : "provider_error" });
    throw error;
  }
  if (response.status !== "completed" || !response.output_text) {
    throw new Error("recreate_evaluation_incomplete");
  }
  const parsed = JSON.parse(response.output_text) as RecreateEvaluation;
  const criticalErrors = parsed.criticalErrors.filter((error) =>
    CRITICAL_ERRORS.includes(error),
  );
  const score = clampScore(parsed.score);
  return {
    ...parsed,
    score,
    identityScore: clampScore(parsed.identityScore),
    compositionScore: clampScore(parsed.compositionScore),
    textScore: clampScore(parsed.textScore),
    criticalErrors,
    approved: score >= 84 && criticalErrors.length === 0,
  };
}
