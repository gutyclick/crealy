import type {
  ContentType,
  GenerationStyle,
  ThumbnailPreset,
} from "@/types/generation";

export type OnboardingObjective = {
  id: string;
  preferenceKey:
    | "youtube_thumbnail"
    | "social_posts"
    | "promotional_creatives";
  label: string;
  description: string;
  exampleImage: string;
  exampleAlt: string;
  contentType: ContentType;
  recommendedStyle: GenerationStyle;
  recommendedStyleLabel: string;
  descriptionSeed: string;
  primaryText?: string;
  videoTitle?: string;
  thumbnailPreset?: ThumbnailPreset;
};

export const ONBOARDING_OBJECTIVES: readonly OnboardingObjective[] = [
  {
    id: "youtube-growth",
    preferenceKey: "youtube_thumbnail",
    label: "Conseguir más clics en YouTube",
    description: "Empieza con una miniatura clara, intensa y legible en móvil.",
    exampleImage: "/images/examples/productivity.webp",
    exampleAlt: "Ejemplo de miniatura de productividad",
    contentType: "thumbnail",
    recommendedStyle: "viral",
    recommendedStyleLabel: "Viral · Impactante",
    descriptionSeed: "Cómo recuperar dos horas al día con un sistema sencillo de productividad",
    videoTitle: "El sistema que me devolvió 2 horas cada día",
    thumbnailPreset: "impactful",
  },
  {
    id: "promote-business",
    preferenceKey: "promotional_creatives",
    label: "Promocionar mi negocio",
    description: "Prepara un post que presente una oferta sin parecer una plantilla.",
    exampleImage: "/images/examples/restaurant.webp",
    exampleAlt: "Ejemplo de publicación para un negocio gastronómico",
    contentType: "social-post",
    recommendedStyle: "professional",
    recommendedStyleLabel: "Profesional · Cuadrado",
    descriptionSeed: "Lanzamiento de un menú de temporada para una cafetería artesanal, cercano y apetitoso",
    primaryText: "NUEVA TEMPORADA",
  },
  {
    id: "teach-something",
    preferenceKey: "social_posts",
    label: "Explicar una idea",
    description: "Convierte un tema complejo en una pieza visual fácil de entender.",
    exampleImage: "/images/examples/technology.webp",
    exampleAlt: "Ejemplo de publicación educativa sobre tecnología",
    contentType: "social-post",
    recommendedStyle: "educational",
    recommendedStyleLabel: "Educativo · Cuadrado",
    descriptionSeed: "Tres usos prácticos de inteligencia artificial para ahorrar tiempo en un pequeño negocio",
    primaryText: "3 USOS REALES DE IA",
  },
  {
    id: "professional-presence",
    preferenceKey: "social_posts",
    label: "Mejorar mi presencia profesional",
    description: "Crea una imagen de perfil reconocible y preparada para redes.",
    exampleImage: "/images/examples/podcast.webp",
    exampleAlt: "Ejemplo de identidad profesional para redes",
    contentType: "profile-image",
    recommendedStyle: "professional",
    recommendedStyleLabel: "Profesional · 1:1",
    descriptionSeed: "Retrato profesional cercano para una persona emprendedora del sector creativo",
  },
] as const;

export function getOnboardingObjective(id?: string | null) {
  return ONBOARDING_OBJECTIVES.find((objective) => objective.id === id) ?? null;
}

export function onboardingCreateRoute(objective: OnboardingObjective) {
  return `/create?type=${encodeURIComponent(objective.contentType)}&onboarding=${encodeURIComponent(objective.id)}`;
}
