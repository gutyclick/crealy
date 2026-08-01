import {
  getDefaultQuality,
  getGenerationVariant,
  getVariantCreditCost,
} from "@/config/generation-products";
import type { GenerationFormat, GenerationQuality } from "@/types/generation";

export function mapGenerationOptions(
  format: GenerationFormat,
  requestedQuality?: GenerationQuality | "fast",
) {
  const definition = getGenerationVariant(format);
  if (!definition) throw new Error("invalid_generation_variant");
  const quality = requestedQuality === "fast"
    ? "standard"
    : requestedQuality ?? getDefaultQuality(definition);
  return {
    size: definition.requestedProviderSize,
    width: definition.width,
    height: definition.height,
    finalSize: `${definition.width}x${definition.height}`,
    aspectRatio: `${definition.width} / ${definition.height}`,
    safeArea: definition.safeArea,
    quality: quality === "standard" ? ("medium" as const) : ("high" as const),
    creditCost: getVariantCreditCost(definition, quality),
    outputFormat: "png" as const,
    mimeType: "image/png" as const,
    extension: "png" as const,
    exportStrategy: definition.exportStrategy,
  };
}
