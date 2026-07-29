import { getContentFormat } from "@/config/content-formats";
import type { GenerationFormat, GenerationQuality } from "@/types/generation";

export function mapGenerationOptions(
  format: GenerationFormat,
  quality: GenerationQuality,
) {
  const definition = getContentFormat(format);
  return {
    size: definition.requestedOpenAISize,
    width: definition.exportWidth,
    height: definition.exportHeight,
    finalSize: `${definition.exportWidth}x${definition.exportHeight}`,
    aspectRatio: `${definition.exportWidth} / ${definition.exportHeight}`,
    safeArea: definition.safeArea,
    quality:
      definition.contentType === "social-cover" ||
      format === "youtube-16-9" ||
      format === "banner-3-1"
        ? ("high" as const)
        : quality === "fast"
          ? ("low" as const)
          : ("high" as const),
    outputFormat: "png" as const,
    mimeType: "image/png" as const,
    extension: "png" as const,
    exportStrategy: definition.exportStrategy,
  };
}

