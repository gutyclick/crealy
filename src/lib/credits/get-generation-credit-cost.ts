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
  creationMode?: "create" | "recreate";
};

export const GENERATION_CREDIT_COSTS = {
  thumbnail: 1,
  post: { standard: 1, high: 2 },
  recreate: { standard: 2, high: 3 },
  bannerOrCover: 5,
} as const;

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
  if (selection.creationMode === "recreate") {
    return GENERATION_CREDIT_COSTS.recreate[selection.quality];
  }
  if (selection.contentType === "thumbnail") {
    return GENERATION_CREDIT_COSTS.thumbnail;
  }
  if (selection.contentType === "social-post") {
    return GENERATION_CREDIT_COSTS.post[selection.quality];
  }
  if (
    selection.contentType === "banner" ||
    selection.contentType === "social-cover"
  ) {
    return GENERATION_CREDIT_COSTS.bannerOrCover;
  }
  return getVariantCreditCost(variant, selection.quality);
}

export function formatCreditCost(cost: number) {
  return `${cost} ${cost === 1 ? "crédito" : "créditos"}`;
}
