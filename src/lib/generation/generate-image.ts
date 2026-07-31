import "server-only";

import OpenAI, { toFile } from "openai";

import { getGenerationVariant } from "@/config/generation-products";
import { getGenerationServerEnv } from "@/lib/env/server";
import { GenerationError, mapOpenAIError } from "@/lib/generation/generation-errors";
import {
  resolveFallbackImageSize,
  resolveImageSize,
} from "@/lib/generation/resolve-image-size";
import { exportToPlatformSize } from "@/lib/image-processing/export-to-platform-size";
import { inspectImage } from "@/lib/image-processing/inspect-image";
import { getOpenAIClient } from "@/lib/openai/client";
import { logger } from "@/lib/observability/logger";
import type {
  GenerationInput,
  GenerationReferenceImage,
} from "@/types/generation";

const MAX_PROVIDER_IMAGE_BYTES = 40 * 1024 * 1024;
const MAX_STORED_IMAGE_BYTES = 20 * 1024 * 1024;

function isUnsupportedSizeError(error: unknown) {
  if (!(error instanceof OpenAI.APIError) || (error.status !== 400 && error.status !== 422)) {
    return false;
  }
  const detail = `${error.code ?? ""} ${error.message}`.toLowerCase();
  return ["size", "dimension", "width", "height", "aspect ratio"].some((term) =>
    detail.includes(term),
  );
}

export async function generateImage(
  input: GenerationInput,
  enhancedPrompt: string,
  referenceImages: GenerationReferenceImage[] = [],
) {
  const { imageModel } = getGenerationServerEnv();
  const resolvedDefinition = getGenerationVariant(input.variant);
  if (!resolvedDefinition) throw new Error("invalid_generation_variant");
  const definition = resolvedDefinition;
  const baseResolutionInput = {
    model: imageModel,
    contentType: input.contentType,
    coverPlatform: input.coverPlatform,
    variant: input.variant,
  };
  let resolved = resolveImageSize(baseResolutionInput);
  let fallbackUsed = false;

  async function requestImage(size: string) {
    const client = getOpenAIClient();
    const quality =
      definition.quality === "high" ? ("high" as const) : ("medium" as const);
    return referenceImages.length > 0
      ? client.images.edit({
          model: imageModel,
          image: await Promise.all(
            referenceImages.map((reference) =>
              toFile(reference.buffer, reference.filename, { type: reference.mimeType }),
            ),
          ),
          prompt: enhancedPrompt,
          size,
          quality,
          output_format: "png",
          background: "opaque",
          n: 1,
        }).withResponse()
      : client.images.generate({
          model: imageModel,
          prompt: enhancedPrompt,
          size,
          quality,
          output_format: "png",
          background: "opaque",
          moderation: "auto",
          n: 1,
        }).withResponse();
  }

  try {
    let providerResponse;
    try {
      providerResponse = await requestImage(resolved.providerSize);
    } catch (error) {
      if (!isUnsupportedSizeError(error)) throw error;
      resolved = resolveFallbackImageSize(
        baseResolutionInput,
        "provider_rejected_requested_size",
      );
      fallbackUsed = true;
      logger.warn("generation_size_fallback", {
        model: imageModel,
        requestedSize: resolved.requestedSize,
        providerSize: resolved.providerSize,
        reason: resolved.fallbackReason,
      });
      providerResponse = await requestImage(resolved.providerSize);
    }

    const encodedImage = providerResponse.data.data?.[0]?.b64_json;
    if (!encodedImage) {
      throw new GenerationError(
        "invalid_provider_response",
        502,
        "No pudimos procesar la imagen recibida.",
      );
    }
    const providerBuffer = Buffer.from(encodedImage, "base64");
    if (!providerBuffer.length || providerBuffer.length > MAX_PROVIDER_IMAGE_BYTES) {
      throw new GenerationError(
        "invalid_provider_response",
        502,
        "No pudimos procesar la imagen recibida.",
      );
    }

    const providerImage = await inspectImage(providerBuffer);
    const dimensionMismatch =
      providerImage.width !== resolved.exportWidth ||
      providerImage.height !== resolved.exportHeight;
    const exported = await exportToPlatformSize({
      buffer: providerBuffer,
      width: resolved.exportWidth,
      height: resolved.exportHeight,
      strategy: definition.exportStrategy,
    });
    const imageBuffer = exported.buffer;
    const finalImage = await inspectImage(imageBuffer);
    if (imageBuffer.length > MAX_STORED_IMAGE_BYTES) {
      throw new GenerationError(
        "invalid_provider_response",
        502,
        "La imagen final supera el límite seguro de almacenamiento.",
      );
    }

    return {
      imageBuffer,
      providerRequestId: providerResponse.request_id,
      model: imageModel,
      size: resolved.providerSize,
      finalSize: `${finalImage.width}x${finalImage.height}`,
      quality: input.quality,
      outputFormat: "png" as const,
      mimeType: "image/png" as const,
      extension: "png" as const,
      width: finalImage.width,
      height: finalImage.height,
      providerWidth: providerImage.width,
      providerHeight: providerImage.height,
      exportWidth: finalImage.width,
      exportHeight: finalImage.height,
      sizeFallbackUsed: fallbackUsed || dimensionMismatch,
      sizeFallbackReason:
        resolved.fallbackReason ??
        (dimensionMismatch ? "provider_returned_unexpected_dimensions" : null),
    };
  } catch (error) {
    throw mapOpenAIError(error);
  }
}
