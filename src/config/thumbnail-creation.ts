import type {
  ThumbnailArchetype,
  ThumbnailNiche,
  ThumbnailPreset,
  ThumbnailTextMode,
} from "@/types/generation";

export const THUMBNAIL_PRESETS: ReadonlyArray<{
  id: ThumbnailPreset;
  label: string;
  description: string;
  direction: readonly string[];
}> = [
  { id: "impactful", label: "Impactante", description: "Directa, intensa y de alto contraste.", direction: ["Primer plano dominante", "Emoción intensa", "Texto grande", "Colores fuertes"] },
  { id: "curiosity", label: "Curiosidad", description: "Abre una pregunta visual.", direction: ["Información parcialmente oculta", "Elemento inesperado", "Sombras y profundidad"] },
  { id: "result", label: "Resultado", description: "El cambio o logro es el protagonista.", direction: ["Resultado visible", "Cifra o transformación", "Mensaje directo"] },
  { id: "comparison", label: "Comparación", description: "Dos opciones, una diferencia inmediata.", direction: ["División clara", "Contraste entre lados", "Poco texto"] },
  { id: "minimal", label: "Minimalista", description: "Una idea con mucho espacio visual.", direction: ["Uno o dos elementos", "Fondo limpio", "Texto muy corto"] },
  { id: "cinematic", label: "Cinematográfica", description: "Una escena narrativa con profundidad.", direction: ["Iluminación dramática", "Apariencia realista", "Momento importante"] },
] as const;

export const THUMBNAIL_TEXT_MODES: ReadonlyArray<{
  id: ThumbnailTextMode;
  label: string;
  description: string;
}> = [
  { id: "automatic", label: "Texto automático", description: "Crealy elegirá una frase breve que complemente el título." },
  { id: "custom", label: "Escribir mi texto", description: "Usaremos exactamente el texto que indiques." },
  { id: "none", label: "Sin texto", description: "La imagen comunicará el concepto por sí sola." },
] as const;

export const THUMBNAIL_NICHES: ReadonlyArray<{ id: ThumbnailNiche; label: string }> = [
  { id: "technology_ai", label: "Inteligencia artificial y tecnología" },
  { id: "finance_business", label: "Finanzas y negocios" },
  { id: "gaming", label: "Gaming" },
  { id: "education", label: "Educación y tutoriales" },
  { id: "productivity", label: "Productividad" },
  { id: "fitness_health", label: "Fitness y salud" },
  { id: "entertainment", label: "Entretenimiento e historias" },
  { id: "travel", label: "Viajes" },
  { id: "beauty_lifestyle", label: "Belleza y estilo de vida" },
  { id: "reactions_news", label: "Reacciones, noticias y actualidad" },
  { id: "general", label: "General" },
] as const;

export const THUMBNAIL_ARCHETYPES: ReadonlyArray<{ id: ThumbnailArchetype; label: string }> = [
  { id: "result", label: "Resultado" },
  { id: "curiosity", label: "Curiosidad" },
  { id: "comparison", label: "Comparación" },
  { id: "warning", label: "Advertencia" },
  { id: "transformation", label: "Transformación" },
  { id: "extreme_moment", label: "Momento extremo" },
] as const;

export const THUMBNAIL_GLOBAL_RULES = [
  "Una sola idea principal y un foco visual dominante.",
  "Máximo un rostro protagonista y dos elementos secundarios.",
  "Composición comprensible en menos de un segundo y legible en móvil.",
  "Alto contraste, sujeto separado del fondo y márgenes seguros.",
  "Formato horizontal 16:9, listo para publicar.",
] as const;

export const THUMBNAIL_AVOID = [
  "composición saturada",
  "collage innecesario",
  "texto pequeño o cortado",
  "palabras duplicadas o letras aleatorias",
  "texto adicional inventado",
  "marcas de agua o logos aleatorios",
  "interfaces sin sentido",
  "rostros, manos u ojos deformados",
  "objetos duplicados",
  "apariencia genérica de stock",
  "elementos no relacionados",
  "clickbait engañoso",
] as const;

