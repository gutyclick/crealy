import type {
  ColorPreference,
  ContentType,
  GenerationFormat,
  GenerationQuality,
  GenerationStyle,
} from "@/types/generation";

export const GENERATION_CONTENT_TYPES = [
  {
    id: "youtube-thumbnail",
    label: "Miniatura",
    fullLabel: "Miniatura de YouTube",
    description: "Una imagen horizontal pensada para captar atención.",
    icon: "monitor-play",
    example:
      "Una miniatura sobre productividad, con un escritorio moderno, contraste alto y espacio para un título grande.",
    formats: ["youtube-16-9"],
  },
  {
    id: "social-post",
    label: "Post",
    fullLabel: "Post para redes",
    description: "Contenido cuadrado o vertical para el feed.",
    icon: "image",
    example:
      "Un post promocional para una cafetería artesanal, cálido, editorial y con el producto como protagonista.",
    formats: ["social-square", "social-portrait"],
  },
  {
    id: "banner",
    label: "Banner",
    fullLabel: "Banner",
    description: "Una composición amplia para campañas y anuncios.",
    icon: "rectangle-horizontal",
    example:
      "Un banner publicitario para el lanzamiento de una aplicación de finanzas, moderno y con mucho espacio negativo.",
    formats: ["banner-3-1"],
  },
  {
    id: "social-cover",
    label: "Portada",
    fullLabel: "Portada para redes",
    description: "Una cabecera panorámica con lectura inmediata.",
    icon: "panels-top-left",
    example:
      "Una portada panorámica para un podcast de negocios, cinematográfica, sobria y con dos presentadores.",
    formats: ["social-cover-panorama"],
  },
] as const satisfies ReadonlyArray<{
  id: ContentType;
  label: string;
  fullLabel: string;
  description: string;
  icon: string;
  example: string;
  formats: readonly GenerationFormat[];
}>;

export const GENERATION_FORMATS = [
  {
    id: "youtube-16-9",
    label: "Horizontal 16:9",
    shortLabel: "16:9",
    contentType: "youtube-thumbnail",
  },
  {
    id: "social-square",
    label: "Cuadrado 1:1",
    shortLabel: "1:1",
    contentType: "social-post",
  },
  {
    id: "social-portrait",
    label: "Vertical 4:5",
    shortLabel: "4:5",
    contentType: "social-post",
  },
  {
    id: "banner-3-1",
    label: "Horizontal 3:1",
    shortLabel: "3:1",
    contentType: "banner",
  },
  {
    id: "social-cover-panorama",
    label: "Horizontal panorámico",
    shortLabel: "12:5",
    contentType: "social-cover",
  },
] as const satisfies ReadonlyArray<{
  id: GenerationFormat;
  label: string;
  shortLabel: string;
  contentType: ContentType;
}>;

export const GENERATION_STYLES = [
  { id: "auto", label: "Automático" },
  { id: "photographic", label: "Fotográfico" },
  { id: "illustration", label: "Ilustración" },
  { id: "minimal", label: "Minimalista" },
  { id: "cinematic", label: "Cinematográfico" },
  { id: "advertising", label: "Publicitario" },
] as const satisfies ReadonlyArray<{ id: GenerationStyle; label: string }>;

export const GENERATION_COLORS = [
  { id: "auto", label: "Automático" },
  { id: "dark", label: "Oscuro" },
  { id: "vibrant", label: "Vibrante" },
  { id: "warm", label: "Cálido" },
  { id: "cool", label: "Frío" },
  { id: "custom", label: "Personalizado" },
] as const satisfies ReadonlyArray<{ id: ColorPreference; label: string }>;

export const GENERATION_QUALITIES = [
  {
    id: "fast",
    label: "Rápida",
    description: "Ideal para explorar ideas con menor consumo.",
  },
  {
    id: "high",
    label: "Alta calidad",
    description: "Más detalle para una pieza final.",
  },
] as const satisfies ReadonlyArray<{
  id: GenerationQuality;
  label: string;
  description: string;
}>;

export const DEFAULT_GENERATION_VALUES = {
  contentType: "youtube-thumbnail",
  format: "youtube-16-9",
  style: "auto",
  colorPreference: "auto",
  quality: "fast",
} as const satisfies {
  contentType: ContentType;
  format: GenerationFormat;
  style: GenerationStyle;
  colorPreference: ColorPreference;
  quality: GenerationQuality;
};

export function getContentTypeConfig(contentType: ContentType) {
  return GENERATION_CONTENT_TYPES.find((item) => item.id === contentType)!;
}

export function getFormatConfig(format: GenerationFormat) {
  return GENERATION_FORMATS.find((item) => item.id === format)!;
}
