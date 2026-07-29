import {
  getContentFormat,
  getPlatformCover,
} from "@/config/content-formats";
import { getImageModelCapabilities } from "@/config/image-models";
import type {
  ContentType,
  CoverPlatform,
  GenerationFormat,
} from "@/types/generation";

export type ResolveImageSizeInput = {
  model: string;
  contentType: ContentType;
  coverPlatform?: CoverPlatform;
  requestedSize?: string;
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

export function resolveImageSize(input: ResolveImageSizeInput): ResolvedImageSize {
  const capabilities = getImageModelCapabilities(input.model);
  const definition =
    input.contentType === "social-cover" && input.coverPlatform
      ? getPlatformCover(input.coverPlatform)
      : getContentFormat(input.format ?? defaultFormatFor(input.contentType));
  const requestedSize = input.requestedSize ?? definition.requestedOpenAISize;
  const direct = capabilities.supportsFlexibleSizes;
  return {
    requestedSize,
    providerSize: direct ? requestedSize : definition.requestedOpenAISize,
    exportWidth: definition.exportWidth,
    exportHeight: definition.exportHeight,
    requiresPostProcessing:
      !direct ||
      requestedSize !== `${definition.exportWidth}x${definition.exportHeight}`,
    fallbackReason: direct ? null : "model_does_not_support_flexible_sizes",
  };
}

export function resolveFallbackImageSize(
  input: ResolveImageSizeInput,
  reason: string,
): ResolvedImageSize {
  const definition =
    input.contentType === "social-cover" && input.coverPlatform
      ? getPlatformCover(input.coverPlatform)
      : getContentFormat(input.format ?? defaultFormatFor(input.contentType));
  const providerSize =
    "fallbackOpenAISize" in definition
      ? definition.fallbackOpenAISize
      : definition.requestedOpenAISize;
  return {
    requestedSize: input.requestedSize ?? definition.requestedOpenAISize,
    providerSize,
    exportWidth: definition.exportWidth,
    exportHeight: definition.exportHeight,
    requiresPostProcessing:
      providerSize !== `${definition.exportWidth}x${definition.exportHeight}`,
    fallbackReason: reason,
  };
}

function defaultFormatFor(contentType: ContentType): GenerationFormat {
  if (contentType === "youtube-thumbnail") return "youtube-16-9";
  if (contentType === "social-post") return "social-square";
  if (contentType === "banner") return "banner-3-1";
  return "youtube-cover";
}

