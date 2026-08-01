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
  // GPT Image 2 accepts up to 8,294,400 pixels when both edges are
  // multiples of 16 and the aspect ratio does not exceed 3:1.
  maxRecommendedPixels: 8_294_400,
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

export function isValidFlexibleImageSize(
  size: string,
  maximumPixels = 8_294_400,
) {
  const match = /^(\d+)x(\d+)$/.exec(size);
  if (!match) return false;
  const width = Number(match[1]);
  const height = Number(match[2]);
  const pixels = width * height;
  return (
    width <= 3840 &&
    height <= 3840 &&
    width % 16 === 0 &&
    height % 16 === 0 &&
    Math.max(width, height) / Math.min(width, height) <= 3 &&
    pixels >= 655_360 &&
    pixels <= maximumPixels
  );
}
