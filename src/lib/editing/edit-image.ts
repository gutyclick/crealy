import "server-only";

import OpenAI from "openai";

import { EDIT_OUTPUT_MODEL } from "@/config/openai";
import { getEditingServerEnv } from "@/lib/env/server";
import { getOpenAIClient } from "@/lib/openai/client";

function isExpiredContextError(error: unknown) {
  if (!(error instanceof OpenAI.APIError) || error.status !== 400) return false;
  const message = `${error.code ?? ""} ${error.message}`.toLowerCase();
  return (
    message.includes("previous_response") ||
    message.includes("response_not_found")
  );
}

async function requestEdit({
  imageBuffer,
  mimeType,
  instruction,
  previousResponseId,
  size,
}: {
  imageBuffer: Buffer;
  mimeType: string;
  instruction: string;
  previousResponseId?: string;
  size: string;
}) {
  const { responsesModel } = getEditingServerEnv();
  return getOpenAIClient().responses.create({
    model: responsesModel,
    reasoning: { effort: "none" },
    previous_response_id: previousResponseId,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: instruction },
          {
            type: "input_image",
            detail: "original",
            image_url: `data:${mimeType};base64,${imageBuffer.toString("base64")}`,
          },
        ],
      },
    ],
    tools: [
      {
        type: "image_generation",
        action: "edit",
        model: EDIT_OUTPUT_MODEL,
        input_fidelity: "high",
        output_format: "png",
        quality: "medium",
        size,
      },
    ],
    tool_choice: { type: "image_generation" },
    store: true,
  });
}

function outputSize(width: number, height: number) {
  const maxEdge = 1536;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const scaledWidth = Math.max(256, Math.round((width * scale) / 16) * 16);
  const scaledHeight = Math.max(256, Math.round((height * scale) / 16) * 16);
  const ratio = scaledWidth / scaledHeight;

  if (ratio > 3 || ratio < 1 / 3) return "auto";
  return `${scaledWidth}x${scaledHeight}`;
}

export async function editImage({
  imageBuffer,
  mimeType,
  instruction,
  previousResponseId,
  width,
  height,
}: {
  imageBuffer: Buffer;
  mimeType: string;
  instruction: string;
  previousResponseId: string | null;
  width: number;
  height: number;
}) {
  const size = outputSize(width, height);
  let response;

  try {
    response = await requestEdit({
      imageBuffer,
      mimeType,
      instruction,
      previousResponseId: previousResponseId ?? undefined,
      size,
    });
  } catch (error) {
    if (!previousResponseId || !isExpiredContextError(error)) throw error;
    response = await requestEdit({
      imageBuffer,
      mimeType,
      instruction,
      size,
    });
  }

  const output = response.output.find(
    (item) =>
      item.type === "image_generation_call" &&
      item.status === "completed" &&
      Boolean(item.result),
  );

  if (!output || output.type !== "image_generation_call" || !output.result) {
    throw new Error("missing_image_output");
  }

  return {
    buffer: Buffer.from(output.result, "base64"),
    providerResponseId: response.id,
    model: getEditingServerEnv().responsesModel,
  };
}

