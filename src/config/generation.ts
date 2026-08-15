import {
  GENERATION_PRODUCTS,
  getGenerationProduct,
  getGenerationVariant,
  getSupportedQualities,
} from "@/config/generation-products";
import { VISUAL_STYLES } from "@/config/visual-styles";
import type {
  ColorPreference,
  ContentType,
  GenerationFormat,
  GenerationQuality,
} from "@/types/generation";

export const GENERATION_CONTENT_TYPES = GENERATION_PRODUCTS.map((product) => ({
  ...product,
  formats: product.variants.map((variant) => variant.id),
}));

export const GENERATION_FORMATS = GENERATION_PRODUCTS.flatMap((product) =>
  product.variants.map((variant) => ({
    id: variant.id,
    label: `${variant.label} · ${variant.width} × ${variant.height}`,
    shortLabel: variant.shortLabel,
    contentType: product.id,
    requestedOpenAISize: variant.requestedProviderSize,
    fallbackOpenAISize: variant.fallbackProviderSize,
    exportWidth: variant.width,
    exportHeight: variant.height,
    safeArea: variant.safeArea,
    exportStrategy: variant.exportStrategy,
  })),
);
export const GENERATION_STYLES = VISUAL_STYLES;

export const GENERATION_COLORS = [
  { id: "auto", label: "Automático" },
  { id: "dark", label: "Oscuro" },
  { id: "vibrant", label: "Vibrante" },
  { id: "warm", label: "Cálido" },
  { id: "cool", label: "Frío" },
  { id: "custom", label: "Personalizado" },
] as const satisfies ReadonlyArray<{ id: ColorPreference; label: string }>;

export const GENERATION_QUALITIES = [
  { id: "standard", label: "Estándar", description: "Ideal para explorar y publicar." },
  { id: "high", label: "Alta calidad", description: "Más detalle para una pieza final." },
] as const satisfies ReadonlyArray<{
  id: GenerationQuality;
  label: string;
  description: string;
}>;

export const MAX_GENERATION_REFERENCE_IMAGES = 4;

export const DEFAULT_GENERATION_VALUES = {
  contentType: "thumbnail",
  format: "thumbnail-standard",
  style: "automatic",
  colorPreference: "auto",
  quality: "standard",
} as const;

export function getContentTypeConfig(contentType: ContentType) {
  const product = getGenerationProduct(contentType);
  return { ...product, formats: product.variants.map((variant) => variant.id) };
}

export function getFormatConfig(format: GenerationFormat) {
  const variant = getGenerationVariant(format);
  if (!variant) throw new Error(`unknown_generation_variant:${format}`);
  return {
    id: variant.id,
    label: `${variant.label} · ${variant.width} × ${variant.height}`,
    shortLabel: variant.shortLabel,
    contentType: variant.contentType,
    requestedOpenAISize: variant.requestedProviderSize,
    fallbackOpenAISize: variant.fallbackProviderSize,
    exportWidth: variant.width,
    exportHeight: variant.height,
    safeArea: variant.safeArea,
    exportStrategy: variant.exportStrategy,
  };
}

export function requiresHighQuality(format: GenerationFormat) {
  const variant = getGenerationVariant(format);
  return variant ? getSupportedQualities(variant).length === 1 : false;
}
