import "server-only";

import { DEFAULT_RESPONSES_MODEL } from "@/config/openai";
import { getOpenAIClient } from "@/lib/openai/client";
import { getPrivateStorage } from "@/lib/storage/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RecreateElementAnalysis } from "@/types/recreate";

const elementAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    kind: {
      type: "string",
      enum: ["person", "product", "object", "background", "mixed"],
    },
    recommendedRole: {
      type: "string",
      enum: ["protagonist", "product", "background", "supporting"],
    },
    faceCount: { type: "integer", minimum: 0, maximum: 8 },
    primarySubject: { type: "string", maxLength: 240 },
    identityAnchors: {
      type: "array",
      items: { type: "string", maxLength: 160 },
      maxItems: 8,
    },
    placementGuidance: { type: "string", maxLength: 320 },
    warnings: {
      type: "array",
      items: { type: "string", maxLength: 160 },
      maxItems: 5,
    },
  },
  required: [
    "kind",
    "recommendedRole",
    "faceCount",
    "primarySubject",
    "identityAnchors",
    "placementGuidance",
    "warnings",
  ],
} as const;

export async function analyzeRecreateElement(userId: string, uploadId: string) {
  const admin = createAdminClient();
  const { data: upload } = await admin
    .from("user_uploads")
    .select("storage_path, mime_type")
    .eq("id", uploadId)
    .eq("user_id", userId)
    .eq("purpose", "reference")
    .maybeSingle();

  if (
    !upload ||
    !["image/jpeg", "image/png", "image/webp"].includes(upload.mime_type)
  ) {
    throw new Error("invalid_element");
  }

  const buffer = await getPrivateStorage().get(upload.storage_path);
  if (!buffer) throw new Error("element_not_found");

  const response = await getOpenAIClient().responses.create({
    model:
      process.env.OPENAI_RESPONSES_MODEL?.trim() || DEFAULT_RESPONSES_MODEL,
    store: false,
    max_output_tokens: 900,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              "Analiza este material que el usuario quiere incorporar en un diseño.",
              "Detecta cuántos rostros humanos claramente visibles hay, sin identificar a la persona ni inferir datos sensibles.",
              "Clasifica el material como person, product, object, background o mixed y recomienda su papel visual.",
              "Describe solo rasgos visibles necesarios para conservar identidad visual, geometría, vestuario, color y detalles distintivos.",
              "Si hay más de una persona, un rostro oculto, baja resolución o recortes que dificulten conservar el elemento, añádelo a warnings.",
              "La guía de ubicación debe explicar cómo integrarlo sin inventar objetos ni cambiar su función.",
            ].join("\n"),
          },
          {
            type: "input_image",
            image_url: `data:${upload.mime_type};base64,${buffer.toString("base64")}`,
            detail: "high",
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "recreate_element_analysis",
        strict: true,
        schema: elementAnalysisSchema,
      },
    },
  });

  if (response.status !== "completed" || !response.output_text) {
    throw new Error("element_analysis_incomplete");
  }

  return JSON.parse(response.output_text) as RecreateElementAnalysis;
}
