import {
  GENERATION_PRODUCTS,
  getGenerationVariant,
  type ExportStrategy,
  type GenerationVariantDefinition,
  type SafeArea,
} from "@/config/generation-products";
import type {
  ContentType,
  CoverPlatform,
  GenerationFormat,
} from "@/types/generation";

export type { ExportStrategy, SafeArea };

export type ContentFormatDefinition = {
  id: GenerationFormat;
  label: string;
  shortLabel: string;
  contentType: ContentType;
  requestedOpenAISize: `${number}x${number}`;
  fallbackOpenAISize: `${number}x${number}`;
  exportWidth: number;
  exportHeight: number;
  safeArea: SafeArea;
  exportStrategy: ExportStrategy;
  requiredQuality?: "high";
  legacy?: boolean;
};

function toFormat(
  contentType: ContentType,
  variant: GenerationVariantDefinition,
): ContentFormatDefinition {
  return {
    id: variant.id,
    label: `${variant.label} · ${variant.width} × ${variant.height}`,
    shortLabel: variant.shortLabel,
    contentType,
    requestedOpenAISize: variant.requestedProviderSize,
    fallbackOpenAISize: variant.fallbackProviderSize,
    exportWidth: variant.width,
    exportHeight: variant.height,
    safeArea: variant.safeArea,
    exportStrategy: variant.exportStrategy,
    ...(variant.quality === "high" ? { requiredQuality: "high" as const } : {}),
  };
}

export const CONTENT_FORMATS = Object.fromEntries(
  GENERATION_PRODUCTS.flatMap((product) =>
    product.variants.map((variant) => [variant.id, toFormat(product.id, variant)]),
  ),
) as Record<GenerationFormat, ContentFormatDefinition>;

const coverProduct = GENERATION_PRODUCTS.find(
  (product) => product.id === "social-cover",
)!;

export const PLATFORM_COVERS = Object.fromEntries(
  coverProduct.variants.map((variant) => [
    variant.platform!,
    {
      ...toFormat("social-cover", variant),
      format: variant.id,
      description: `${variant.description} · ${variant.width} × ${variant.height}`,
      requestedOpenAISize: variant.requestedProviderSize,
      fallbackOpenAISize: variant.fallbackProviderSize,
      requiredQuality: "high" as const,
      promptGuidelines: variant.promptGuidelines,
      previewTemplate: `${variant.platform}-cover`,
    },
  ]),
) as unknown as Record<CoverPlatform, ContentFormatDefinition & {
  format: GenerationFormat;
  description: string;
  requestedOpenAISize: `${number}x${number}`;
  fallbackOpenAISize: `${number}x${number}`;
  requiredQuality: "high";
  promptGuidelines: readonly string[];
  previewTemplate: string;
}>;

export const COVER_PLATFORMS = Object.entries(PLATFORM_COVERS).map(
  ([platform, definition]) => ({ platform: platform as CoverPlatform, ...definition }),
);

export function getContentFormat(format: GenerationFormat) {
  const variant = getGenerationVariant(format);
  if (!variant) throw new Error(`unknown_generation_variant:${format}`);
  return toFormat(variant.contentType, variant);
}

export function getPlatformCover(platform: CoverPlatform) {
  return PLATFORM_COVERS[platform];
}
