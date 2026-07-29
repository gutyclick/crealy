import "server-only";

import { getGenerationServerEnv } from "@/lib/env/server";
import { GenerationError, mapOpenAIError } from "@/lib/generation/generation-errors";
import { mapGenerationOptions } from "@/lib/generation/map-generation-options";
import { getOpenAIClient } from "@/lib/openai/client";
import type { GenerationInput } from "@/types/generation";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

export async function generateImage(
  input: GenerationInput,
  enhancedPrompt: string,
) {
  const { imageModel } = getGenerationServerEnv();
  const output = mapGenerationOptions(input.format, input.quality);

  try {
    const { data: response, request_id: providerRequestId } =
      await getOpenAIClient()
        .images.generate({
          model: imageModel,
          prompt: enhancedPrompt,
          size: output.size,
          quality: output.quality,
          output_format: output.outputFormat,
          background: "opaque",
          moderation: "auto",
          n: 1,
        })
        .withResponse();

    const encodedImage = response.data?.[0]?.b64_json;
    if (!encodedImage) {
      throw new GenerationError(
        "invalid_provider_response",
        502,
        "No pudimos procesar la imagen recibida.",
      );
    }

    const imageBuffer = Buffer.from(encodedImage, "base64");
    if (
      imageBuffer.length === 0 ||
      imageBuffer.length > MAX_IMAGE_BYTES ||
      !imageBuffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
    ) {
      throw new GenerationError(
        "invalid_provider_response",
        502,
        "No pudimos procesar la imagen recibida.",
      );
    }

    return {
      imageBuffer,
      providerRequestId,
      model: imageModel,
      ...output,
    };
  } catch (error) {
    throw mapOpenAIError(error);
  }
}
