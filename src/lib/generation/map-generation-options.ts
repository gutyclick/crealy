import type {
  GenerationFormat,
  GenerationQuality,
} from "@/types/generation";

type ImageQuality = "low" | "high";

const FORMAT_OUTPUTS: Record<
  GenerationFormat,
  { size: string; width: number; height: number; aspectRatio: string }
> = {
  "youtube-16-9": {
    size: "1536x864",
    width: 1536,
    height: 864,
    aspectRatio: "16 / 9",
  },
  "social-square": {
    size: "1024x1024",
    width: 1024,
    height: 1024,
    aspectRatio: "1 / 1",
  },
  "social-portrait": {
    size: "1024x1280",
    width: 1024,
    height: 1280,
    aspectRatio: "4 / 5",
  },
  "banner-3-1": {
    size: "1536x512",
    width: 1536,
    height: 512,
    aspectRatio: "3 / 1",
  },
  "social-cover-panorama": {
    size: "1536x640",
    width: 1536,
    height: 640,
    aspectRatio: "12 / 5",
  },
};

const QUALITY_OUTPUTS: Record<GenerationQuality, ImageQuality> = {
  fast: "low",
  high: "high",
};

export function mapGenerationOptions(
  format: GenerationFormat,
  quality: GenerationQuality,
) {
  return {
    ...FORMAT_OUTPUTS[format],
    quality: QUALITY_OUTPUTS[quality],
    outputFormat: "png" as const,
    mimeType: "image/png" as const,
    extension: "png" as const,
  };
}
