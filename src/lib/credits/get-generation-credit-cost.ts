import {
  getGenerationProduct,
  getGenerationVariant,
} from "@/config/generation-products";
import type {
  ContentType,
  GenerationFormat,
  GenerationPlatform,
  GenerationQuality,
} from "@/types/generation";

export type GenerationCostSelection = {
  contentType: ContentType;
  variant: GenerationFormat;
  platform?: GenerationPlatform;
  quality: GenerationQuality;
};

export function getGenerationCreditCost(selection: GenerationCostSelection) {
  const product = getGenerationProduct(selection.contentType);
  const variant = getGenerationVariant(selection.variant);
  if (!variant || variant.contentType !== product.id) {
    throw new Error("invalid_generation_variant");
  }
  if (
    variant.platform &&
    selection.platform &&
    variant.platform !== selection.platform
  ) {
    throw new Error("invalid_generation_platform");
  }
  if (variant.quality !== selection.quality) {
    throw new Error("invalid_generation_quality");
  }
  return variant.creditCost;
}

export function formatCreditCost(cost: number) {
  return `${cost} ${cost === 1 ? "crédito" : "créditos"}`;
}
