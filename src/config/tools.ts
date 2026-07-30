import type { ToolCategory, ToolDefinition } from "@/types/tools";

function enabled(name: string, fallback = true) {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return fallback;
  return value === "true";
}

const publicToolsEnabled = enabled("NEXT_PUBLIC_TOOLS_ENABLED");
const youtubeDownloadsEnabled = enabled(
  "NEXT_PUBLIC_YOUTUBE_DOWNLOADS_ENABLED",
);
const analysisEnabled = enabled("NEXT_PUBLIC_THUMBNAIL_ANALYSIS_ENABLED");
const comparatorEnabled = enabled("NEXT_PUBLIC_THUMBNAIL_COMPARATOR_ENABLED");

export const tools = [
  {
    id: "youtube-thumbnail-preview",
    name: "Vista previa de miniatura",
    description:
      "Comprueba cómo se lee una miniatura de YouTube en distintos tamaños.",
    href: "/tools/youtube-thumbnail-preview",
    category: "preview",
    requiresAuth: false,
    usesAI: false,
    isEnabled: publicToolsEnabled,
    icon: "image",
  },
  {
    id: "youtube-banner-preview",
    name: "Vista previa de banner",
    description:
      "Visualiza los recortes de TV, escritorio, tableta y móvil.",
    href: "/tools/youtube-banner-preview",
    category: "preview",
    requiresAuth: false,
    usesAI: false,
    isEnabled: publicToolsEnabled,
    icon: "panel",
  },
  {
    id: "social-post-preview",
    name: "Vista previa para redes",
    description:
      "Revisa una publicación en Instagram, X, LinkedIn y Facebook.",
    href: "/tools/social-post-preview",
    category: "preview",
    requiresAuth: false,
    usesAI: false,
    isEnabled: publicToolsEnabled,
    icon: "share",
  },
  {
    id: "youtube-thumbnail-downloader",
    name: "Descargar miniaturas",
    description:
      "Encuentra las variantes públicas disponibles de un video de YouTube.",
    href: "/tools/youtube-thumbnail-downloader",
    category: "download",
    requiresAuth: false,
    usesAI: false,
    isEnabled: publicToolsEnabled && youtubeDownloadsEnabled,
    icon: "download",
  },
  {
    id: "youtube-banner-downloader",
    name: "Descargar banner",
    description:
      "Consulta el banner público de un canal mediante la API oficial.",
    href: "/tools/youtube-banner-downloader",
    category: "download",
    requiresAuth: false,
    usesAI: false,
    isEnabled: publicToolsEnabled && youtubeDownloadsEnabled,
    icon: "download",
  },
  {
    id: "image-size-checker",
    name: "Comprobar tamaño",
    description:
      "Conoce dimensiones, formato, peso y proporción sin subir el archivo.",
    href: "/tools/image-size-checker",
    category: "utility",
    requiresAuth: false,
    usesAI: false,
    isEnabled: publicToolsEnabled,
    icon: "scan",
  },
  {
    id: "safe-area-checker",
    name: "Comprobar zona segura",
    description:
      "Superpone guías para mantener texto y logos dentro del área visible.",
    href: "/tools/safe-area-checker",
    category: "utility",
    requiresAuth: false,
    usesAI: false,
    isEnabled: publicToolsEnabled,
    icon: "frame",
  },
  {
    id: "thumbnail-analyzer",
    name: "Analizador de miniaturas",
    description:
      "Recibe una lectura visual estructurada con acciones concretas.",
    href: "/tools/thumbnail-analyzer",
    category: "analysis",
    requiresAuth: true,
    usesAI: true,
    isEnabled: publicToolsEnabled && analysisEnabled,
    icon: "sparkles",
  },
  {
    id: "thumbnail-comparator",
    name: "Comparador de miniaturas",
    description:
      "Compara entre dos y tres propuestas a tamaño grande y reducido.",
    href: "/tools/thumbnail-comparator",
    category: "analysis",
    requiresAuth: false,
    usesAI: false,
    isEnabled: publicToolsEnabled && comparatorEnabled,
    icon: "compare",
  },
] as const satisfies readonly ToolDefinition[];

export const toolCategoryLabels: Record<
  ToolCategory,
  { title: string; description: string }
> = {
  preview: {
    title: "Previsualiza",
    description: "Mira tu diseño en contexto antes de publicarlo.",
  },
  analysis: {
    title: "Analiza",
    description: "Detecta problemas de lectura, jerarquía y claridad.",
  },
  download: {
    title: "Descarga",
    description: "Recupera recursos públicos sin pasos innecesarios.",
  },
  utility: {
    title: "Verifica",
    description: "Comprueba medidas y zonas seguras directamente en tu equipo.",
  },
};

export function getTool(id: string) {
  return tools.find((tool) => tool.id === id);
}
