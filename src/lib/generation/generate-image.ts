import "server-only";

import { toFile } from "openai";

import { getGenerationServerEnv } from "@/lib/env/server";
import { GenerationError, mapOpenAIError } from "@/lib/generation/generation-errors";
import { mapGenerationOptions } from "@/lib/generation/map-generation-options";
import { getOpenAIClient } from "@/lib/openai/client";
import type {
  GenerationInput,
  GenerationReferenceImage,
} from "@/types/generation";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

export async function generateImage(
  input: GenerationInput,
  enhancedPrompt: string,
  referenceImages: GenerationReferenceImage[] = [],
) {
  const { imageModel } = getGenerationServerEnv();
  const output = mapGenerationOptions(input.format, input.quality);

  try {
    const request =
      referenceImages.length > 0
        ? getOpenAIClient().images.edit({
            model: imageModel,
            image: await Promise.all(
              referenceImages.map((reference) =>
                toFile(reference.buffer, reference.filename, {
                  type: reference.mimeType,
                }),
              ),
            ),
            prompt: enhancedPrompt,
            size: output.size,
            quality: output.quality,
            output_format: output.outputFormat,
            background: "opaque",
            n: 1,
          })
        : getOpenAIClient().images.generate({
            model: imageModel,
            prompt: enhancedPrompt,
            size: output.size,
            quality: output.quality,
            output_format: output.outputFormat,
            background: "opaque",
            moderation: "auto",
            n: 1,
          });
    const { data: response, request_id: providerRequestId } =
      await request.withResponse();

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
