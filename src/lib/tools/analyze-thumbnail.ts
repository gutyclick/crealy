import "server-only";

import OpenAI from "openai";

import { isThumbnailAnalysis } from "@/lib/tools/validate-thumbnail-analysis";

const scoreCategory = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    feedback: { type: "string" },
  },
  required: ["score", "feedback"],
} as const;

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    overallScore: { type: "integer", minimum: 0, maximum: 100 },
    summary: { type: "string" },
    categories: {
      type: "object",
      additionalProperties: false,
      properties: {
        composition: scoreCategory,
        textLegibility: scoreCategory,
        visualHierarchy: scoreCategory,
        contrast: scoreCategory,
        smallSizeClarity: scoreCategory,
        focus: scoreCategory,
      },
      required: [
        "composition",
        "textLegibility",
        "visualHierarchy",
        "contrast",
        "smallSizeClarity",
        "focus",
      ],
    },
    strengths: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 5,
    },
    improvements: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 5,
    },
    suggestedActions: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 5,
    },
  },
  required: [
    "overallScore",
    "summary",
    "categories",
    "strengths",
    "improvements",
    "suggestedActions",
  ],
} as const;

export async function analyzeThumbnail({
  buffer,
  mimeType,
  model,
  apiKey,
}: {
  buffer: Buffer;
  mimeType: string;
  model: string;
  apiKey: string;
}) {
  const client = new OpenAI({ apiKey, maxRetries: 0, timeout: 45_000 });
  const response = await client.responses.create({
    model,
    store: false,
    max_output_tokens: 1_400,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Analiza esta miniatura en español como director visual. Evalúa solo cualidades observables: composición, legibilidad del texto, jerarquía visual, contraste, claridad a tamaño pequeño y foco. No predigas CTR, visitas ni rendimiento. Da feedback breve, específico y accionable; evita elogios genéricos.",
          },
          {
            type: "input_image",
            image_url: `data:${mimeType};base64,${buffer.toString("base64")}`,
            detail: "high",
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "thumbnail_analysis",
        strict: true,
        schema: analysisSchema,
      },
    },
  });
  if (response.status !== "completed" || !response.output_text) {
    throw new Error("analysis_incomplete");
  }
  const parsed = JSON.parse(response.output_text) as unknown;
  if (!isThumbnailAnalysis(parsed)) throw new Error("analysis_invalid");
  return { analysis: parsed, responseId: response.id };
}
