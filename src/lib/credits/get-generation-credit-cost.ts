import {
  getGenerationProduct,
  getGenerationVariant,
  getSupportedQualities,
  getVariantCreditCost,
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
  if (!getSupportedQualities(variant).includes(selection.quality)) {
    throw new Error("invalid_generation_quality");
  }
  return getVariantCreditCost(variant, selection.quality);
}

export function formatCreditCost(cost: number) {
  return `${cost} ${cost === 1 ? "crédito" : "créditos"}`;
}
