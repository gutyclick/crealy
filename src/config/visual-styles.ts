import type {
  ContentType,
  CoverPlatform,
  GenerationStyle,
  LegacyContentType,
} from "@/types/generation";

export type VisualStyle = Exclude<
  GenerationStyle,
  "auto" | "photographic" | "illustration" | "advertising"
>;

export type VisualStyleDefinition = {
  id: VisualStyle;
  label: string;
  description: string;
  previewAsset: string | null;
  promptGuidelines: readonly string[];
  compatibleContentTypes: readonly ContentType[];
};

const ALL_CONTENT_TYPES: readonly ContentType[] = [
  "thumbnail",
  "social-post",
  "banner",
  "social-cover",
  "story",
  "profile-image",
];

export const VISUAL_STYLES = [
  {
    id: "automatic",
    label: "Automático",
    description: "La dirección más adecuada para tu brief.",
    previewAsset: null,
    promptGuidelines: ["Prioriza legibilidad, equilibrio y una jerarquía clara."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "viral",
    label: "Viral",
    description: "Impacto inmediato y contraste alto.",
    previewAsset: "/styles/viral.webp",
    promptGuidelines: ["Sujeto dominante.", "Jerarquía enérgica pero limpia.", "Pocos elementos secundarios y formas grandes."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "gamer",
    label: "Gamer",
    description: "Energía digital, profundidad y luz dramática.",
    previewAsset: "/styles/gamer.webp",
    promptGuidelines: ["Luz dramática y colores intensos.", "Composición dinámica con profundidad.", "Detalles digitales controlados."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "sports",
    label: "Deportivo",
    description: "Movimiento, competición y sujeto destacado.",
    previewAsset: "/styles/sports.webp",
    promptGuidelines: ["Sensación de movimiento.", "Tipografía fuerte y contraste.", "Sujeto principal destacado."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "minimal",
    label: "Minimalista",
    description: "Espacio negativo y jerarquía esencial.",
    previewAsset: "/styles/minimal.webp",
    promptGuidelines: ["Pocos elementos.", "Tipografía limpia.", "Paleta controlada y espacio negativo generoso."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "professional",
    label: "Profesional",
    description: "Orden, confianza y contraste moderado.",
    previewAsset: "/styles/professional.webp",
    promptGuidelines: ["Composición ordenada.", "Tipografía clara.", "Apariencia confiable sin efectos excesivos."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "podcast",
    label: "Podcast",
    description: "Identidad editorial para presentadores y episodios.",
    previewAsset: "/styles/podcast.webp",
    promptGuidelines: ["Protagonista o presentadores claros.", "Título legible.", "Identidad de programa con apariencia editorial."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "cinematic",
    label: "Cinematográfico",
    description: "Atmósfera narrativa, luz y profundidad.",
    previewAsset: "/styles/cinematic.webp",
    promptGuidelines: ["Iluminación cinematográfica.", "Profundidad atmosférica.", "Encuadre narrativo y contraste controlado."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "corporate",
    label: "Corporativo",
    description: "Marca sólida, estructura y claridad comercial.",
    previewAsset: "/styles/corporate.webp",
    promptGuidelines: ["Composición institucional contemporánea.", "Geometría clara.", "Confianza y consistencia de marca."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "educational",
    label: "Educativo",
    description: "Conceptos claros, didácticos y memorables.",
    previewAsset: "/styles/educational.webp",
    promptGuidelines: ["Jerarquía didáctica.", "Concepto central fácil de reconocer.", "Elementos explicativos simples."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "technology",
    label: "Tecnología",
    description: "Precisión, innovación y detalle digital.",
    previewAsset: "/styles/technology.webp",
    promptGuidelines: ["Sensación de innovación.", "Detalles digitales precisos.", "Volumen y luz contemporáneos."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "luxury",
    label: "Lujo",
    description: "Elegancia editorial y materiales refinados.",
    previewAsset: "/styles/luxury.webp",
    promptGuidelines: ["Composición refinada.", "Contraste sobrio.", "Materiales premium y detalles contenidos."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "news",
    label: "Noticias",
    description: "Urgencia, autoridad y lectura rápida.",
    previewAsset: "/styles/news.webp",
    promptGuidelines: ["Jerarquía informativa inmediata.", "Contraste editorial.", "Sensación de actualidad sin imitar marcas."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "promotional",
    label: "Promocional",
    description: "Oferta clara, producto protagonista y acción visible.",
    previewAsset: null,
    promptGuidelines: ["Producto o servicio protagonista.", "Mensaje comercial directo sin saturación.", "Contraste suficiente para la llamada a la acción."],
    compatibleContentTypes: ["social-post", "banner", "story"],
  },
  {
    id: "fashion",
    label: "Moda",
    description: "Dirección editorial, gesto y estilismo.",
    previewAsset: null,
    promptGuidelines: ["Composición editorial.", "Styling cuidado y luz definida.", "Evita clichés de pasarela genéricos."],
    compatibleContentTypes: ["social-post", "story", "profile-image"],
  },
  {
    id: "food",
    label: "Gastronomía",
    description: "Texturas apetecibles y producto bien iluminado.",
    previewAsset: null,
    promptGuidelines: ["Alimento protagonista.", "Luz de estudio apetecible.", "Texturas nítidas y color creíble."],
    compatibleContentTypes: ["social-post", "story", "banner"],
  },
  {
    id: "event",
    label: "Evento",
    description: "Fecha, energía y lectura inmediata.",
    previewAsset: null,
    promptGuidelines: ["Jerarquía clara para fecha y nombre.", "Atmósfera coherente con el evento.", "Lectura rápida en móvil."],
    compatibleContentTypes: ["social-post", "story", "banner"],
  },
] as const satisfies readonly VisualStyleDefinition[];

export function resolveAutomaticStyle(input: {
  contentType: ContentType | LegacyContentType;
  coverPlatform?: CoverPlatform;
  description: string;
  primaryText?: string;
}): Exclude<VisualStyle, "automatic"> {
  const text = `${input.description} ${input.primaryText ?? ""}`.toLowerCase();
  const rules: ReadonlyArray<[readonly string[], Exclude<VisualStyle, "automatic">]> = [
    [["podcast", "episodio", "entrevista"], "podcast"],
    [["juego", "gaming", "gamer", "stream"], "gamer"],
    [["deporte", "fútbol", "fitness", "entrenamiento"], "sports"],
    [["noticia", "última hora", "actualidad"], "news"],
    [["curso", "aprende", "tutorial", "educación"], "educational"],
    [["tecnología", "software", "inteligencia artificial", "app"], "technology"],
    [["lujo", "premium", "exclusivo", "elegante"], "luxury"],
    [["película", "cinematográfico", "tráiler"], "cinematic"],
    [["empresa", "negocio", "corporativo", "consultoría"], "corporate"],
    [["viral", "impactante", "sorpresa"], "viral"],
    [["minimal", "limpio", "simple"], "minimal"],
  ];
  return rules.find(([keywords]) => keywords.some((keyword) => text.includes(keyword)))?.[1]
    ?? (input.coverPlatform === "linkedin" ? "professional" : "professional");
}

export function getVisualStyle(style: GenerationStyle) {
  const normalized = style === "auto" ? "automatic" : style;
  return VISUAL_STYLES.find((item) => item.id === normalized);
}

const STORY_STYLES = new Set<GenerationStyle>([
  "automatic",
  "viral",
  "promotional",
  "minimal",
  "professional",
  "gamer",
  "sports",
  "fashion",
  "food",
  "event",
  "educational",
]);

const PROFILE_STYLES = new Set<GenerationStyle>([
  "automatic",
  "minimal",
  "professional",
  "corporate",
  "luxury",
  "fashion",
]);

export function isVisualStyleCompatible(
  style: GenerationStyle,
  contentType: ContentType,
) {
  if (contentType === "story") return STORY_STYLES.has(style);
  if (contentType === "profile-image") return PROFILE_STYLES.has(style);
  return Boolean(
    getVisualStyle(style)?.compatibleContentTypes.some(
      (type) => type === contentType,
    ),
  );
}
