import { getGenerationVariant } from "@/config/generation-products";
import type { GenerationFormat, GenerationQuality } from "@/types/generation";

export function mapGenerationOptions(
  format: GenerationFormat,
  _quality?: GenerationQuality | "fast",
) {
  void _quality;
  const definition = getGenerationVariant(format);
  if (!definition) throw new Error("invalid_generation_variant");
  return {
    size: definition.requestedProviderSize,
    width: definition.width,
    height: definition.height,
    finalSize: `${definition.width}x${definition.height}`,
    aspectRatio: `${definition.width} / ${definition.height}`,
    safeArea: definition.safeArea,
    quality: definition.quality === "standard" ? ("medium" as const) : ("high" as const),
    creditCost: definition.creditCost,
    outputFormat: "png" as const,
    mimeType: "image/png" as const,
    extension: "png" as const,
    exportStrategy: definition.exportStrategy,
  };
}
