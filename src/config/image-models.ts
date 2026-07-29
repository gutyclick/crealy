export type ImageQuality = "auto" | "low" | "medium" | "high";

export type ImageModelCapabilities = {
  supportsFlexibleSizes: boolean;
  supportsTwoK: boolean;
  supportsFourK: boolean;
  supportedQualities: readonly ImageQuality[];
  maxRecommendedPixels: number | null;
};

const GPT_IMAGE_2_CAPABILITIES = {
  supportsFlexibleSizes: true,
  supportsTwoK: true,
  supportsFourK: true,
  supportedQualities: ["auto", "low", "medium", "high"],
  maxRecommendedPixels: 2560 * 1440,
} as const satisfies ImageModelCapabilities;

const LEGACY_CAPABILITIES = {
  supportsFlexibleSizes: false,
  supportsTwoK: false,
  supportsFourK: false,
  supportedQualities: ["auto", "low", "medium", "high"],
  maxRecommendedPixels: 1536 * 1024,
} as const satisfies ImageModelCapabilities;

export function getImageModelCapabilities(
  model: string,
): ImageModelCapabilities {
  return model === "gpt-image-2"
    ? GPT_IMAGE_2_CAPABILITIES
    : LEGACY_CAPABILITIES;
}

export const DEFAULT_IMAGE_MODEL = "gpt-image-2";

