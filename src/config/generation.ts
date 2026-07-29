import {
  CONTENT_FORMATS,
  getContentFormat,
} from "@/config/content-formats";
import { VISUAL_STYLES } from "@/config/visual-styles";
import type {
  ColorPreference,
  ContentType,
  GenerationFormat,
  GenerationQuality,
} from "@/types/generation";

export const GENERATION_CONTENT_TYPES = [
  {
    id: "youtube-thumbnail",
    label: "Miniatura",
    fullLabel: "Miniatura de YouTube",
    description: "Miniatura Full HD de 1920 × 1080.",
    icon: "monitor-play",
    example: "Una miniatura sobre productividad, con contraste alto y espacio para un título grande.",
    formats: ["youtube-16-9"],
  },
  {
    id: "social-post",
    label: "Post",
    fullLabel: "Post para redes",
    description: "Contenido cuadrado o vertical para el feed.",
    icon: "image",
    example: "Un post promocional para una cafetería artesanal, cálido y editorial.",
    formats: ["social-square", "social-portrait"],
  },
  {
    id: "banner",
    label: "Banner",
    fullLabel: "Banner publicitario",
    description: "Composición panorámica para campañas.",
    icon: "rectangle-horizontal",
    example: "Un banner para una aplicación de finanzas, moderno y con espacio negativo.",
    formats: ["banner-3-1"],
  },
  {
    id: "social-cover",
    label: "Portada",
    fullLabel: "Portada para plataforma",
    description: "Cabecera adaptada a YouTube, Facebook, X o LinkedIn.",
    icon: "panels-top-left",
    example: "Una portada para un podcast de negocios, sobria y cinematográfica.",
    formats: ["youtube-cover", "facebook-cover", "x-cover", "linkedin-cover"],
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

export const GENERATION_FORMATS = Object.values(CONTENT_FORMATS);
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
  { id: "fast", label: "Rápida", description: "Ideal para explorar ideas con menor consumo." },
  { id: "high", label: "Alta calidad", description: "Más detalle para una pieza final." },
] as const satisfies ReadonlyArray<{
  id: GenerationQuality;
  label: string;
  description: string;
}>;

export const DEFAULT_GENERATION_VALUES = {
  contentType: "youtube-thumbnail",
  format: "youtube-16-9",
  style: "automatic",
  colorPreference: "auto",
  quality: "high",
} as const;

export function getContentTypeConfig(contentType: ContentType) {
  return GENERATION_CONTENT_TYPES.find((item) => item.id === contentType)!;
}

export function getFormatConfig(format: GenerationFormat) {
  return getContentFormat(format);
}

export function requiresHighQuality(format: GenerationFormat) {
  return (
    format === "youtube-16-9" ||
    format === "banner-3-1" ||
    format === "youtube-cover" ||
    format === "facebook-cover" ||
    format === "x-cover" ||
    format === "linkedin-cover"
  );
}

