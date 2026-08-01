import {
  getGenerationProduct,
  getGenerationVariant,
} from "@/config/generation-products";
import {
  getImageModelCapabilities,
  isValidFlexibleImageSize,
} from "@/config/image-models";
import type {
  ContentType,
  GenerationFormat,
  GenerationPlatform,
} from "@/types/generation";

export type ResolveImageSizeInput = {
  model: string;
  contentType: ContentType;
  platform?: GenerationPlatform;
  coverPlatform?: GenerationPlatform;
  requestedSize?: string;
  variant?: GenerationFormat;
  format?: GenerationFormat;
};

export type ResolvedImageSize = {
  requestedSize: string;
  providerSize: string;
  exportWidth: number;
  exportHeight: number;
  requiresPostProcessing: boolean;
  fallbackReason: string | null;
};

function definitionFor(input: ResolveImageSizeInput) {
  const product = getGenerationProduct(input.contentType);
  const definition = getGenerationVariant(
    input.variant ?? input.format ?? product.defaultVariant,
  );
  if (!definition || definition.contentType !== input.contentType) {
    throw new Error("invalid_generation_variant");
  }
  return definition;
}

export function resolveImageSize(input: ResolveImageSizeInput): ResolvedImageSize {
  const capabilities = getImageModelCapabilities(input.model);
  const definition = definitionFor(input);
  const requestedSize = input.requestedSize ?? definition.requestedProviderSize;
  const direct =
    capabilities.supportsFlexibleSizes &&
    isValidFlexibleImageSize(
      requestedSize,
      capabilities.maxRecommendedPixels ?? 8_294_400,
    );
  const providerSize = direct ? requestedSize : definition.fallbackProviderSize;
  return {
    requestedSize,
    providerSize,
    exportWidth: definition.width,
    exportHeight: definition.height,
    requiresPostProcessing:
      providerSize !== `${definition.width}x${definition.height}`,
    fallbackReason: direct ? null : "model_does_not_support_requested_size",
  };
}

export function resolveFallbackImageSize(
  input: ResolveImageSizeInput,
  reason: string,
): ResolvedImageSize {
  const definition = definitionFor(input);
  return {
    requestedSize: input.requestedSize ?? definition.requestedProviderSize,
    providerSize: definition.fallbackProviderSize,
    exportWidth: definition.width,
    exportHeight: definition.height,
    requiresPostProcessing:
      definition.fallbackProviderSize !== `${definition.width}x${definition.height}`,
    fallbackReason: reason,
  };
}
