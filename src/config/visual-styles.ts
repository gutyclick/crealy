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
    promptGuidelines: ["Detecta nicho, emoción y objetivo antes de elegir el lenguaje visual.", "Elige una dirección concreta y reconocible; no mezcles estilos por defecto.", "Prioriza una historia visual y una jerarquía legible en móvil."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "viral",
    label: "Viral",
    description: "Impacto inmediato y contraste alto.",
    previewAsset: "/styles/viral.webp",
    promptGuidelines: ["Sujeto dominante con gesto o acción creíble, nunca una cara flotante genérica.", "Escalas extremas, contraste decidido y una única tensión visual fácil de entender.", "Objetos específicos del tema, recortes precisos y acabado de creador profesional.", "Tipografía contundente integrada a la escena; evita glow, flechas y círculos gratuitos."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "gamer",
    label: "Gamer",
    description: "Energía digital, profundidad y luz dramática.",
    previewAsset: "/styles/gamer.webp",
    promptGuidelines: ["Acción congelada, perspectiva inmersiva y profundidad propia del juego mencionado.", "Iluminación motivada por el mundo del juego; evita neón morado-azul automático.", "HUD, partículas o energía solo si pertenecen al universo visual y aportan información.", "Sujeto y elemento jugable deben leerse incluso a tamaño móvil."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "sports",
    label: "Deportivo",
    description: "Movimiento, competición y sujeto destacado.",
    previewAsset: "/styles/sports.webp",
    promptGuidelines: ["Captura esfuerzo, velocidad o choque en el instante de máxima tensión.", "Anatomía atlética realista, dirección de movimiento clara y fondo contextual reconocible.", "Luz dura de estadio o exterior y contraste editorial deportivo.", "Cifras, marcador o tipografía solo cuando expliquen el reto o resultado."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "minimal",
    label: "Minimalista",
    description: "Espacio negativo y jerarquía esencial.",
    previewAsset: "/styles/minimal.webp",
    promptGuidelines: ["Uno o dos elementos con siluetas impecables y espacio negativo intencional.", "Jerarquía por escala, alineación y contraste, no por efectos decorativos.", "Tipografía editorial precisa y paleta corta con un solo acento.", "El minimalismo debe aumentar la intriga o claridad, no parecer vacío."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "professional",
    label: "Profesional",
    description: "Orden, confianza y contraste moderado.",
    previewAsset: "/styles/professional.webp",
    promptGuidelines: ["Fotografía y retoque creíbles con luz de estudio o entorno laboral real.", "Composición segura y contemporánea con evidencia concreta del tema.", "Tipografía sobria, márgenes precisos y contraste moderado.", "Evita apretones de manos, oficinas de stock y poses corporativas artificiales."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "podcast",
    label: "Podcast",
    description: "Identidad editorial para presentadores y episodios.",
    previewAsset: "/styles/podcast.webp",
    promptGuidelines: ["Presentador reconocible con identidad facial intacta y encuadre editorial cercano.", "Micrófono, invitado o tema como contexto narrativo; no llenes la escena de equipo.", "Sistema gráfico de episodio consistente pero con concepto propio para ese tema.", "Iluminación de estudio cálida y tipografía con carácter de programa."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "cinematic",
    label: "Cinematográfico",
    description: "Atmósfera narrativa, luz y profundidad.",
    previewAsset: "/styles/cinematic.webp",
    promptGuidelines: ["Construye un fotograma narrativo con primer plano, plano medio y fondo.", "Luz motivada, lente y color grading coherentes con la historia.", "Captura el instante anterior o posterior al hecho clave para crear tensión.", "Evita póster genérico, teal-orange automático, humo y partículas sin causa."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "corporate",
    label: "Corporativo",
    description: "Marca sólida, estructura y claridad comercial.",
    previewAsset: "/styles/corporate.webp",
    promptGuidelines: ["Retícula sólida, geometría limpia y una propuesta comercial inequívoca.", "Usa producto, dato o proceso real como evidencia; evita iconografía de stock.", "Color y tipografía alineados con una marca contemporánea y confiable.", "La autoridad debe venir del orden y la precisión, no de una apariencia aburrida."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "educational",
    label: "Educativo",
    description: "Conceptos claros, didácticos y memorables.",
    previewAsset: "/styles/educational.webp",
    promptGuidelines: ["Convierte el aprendizaje en una demostración visual concreta, no en una pizarra llena.", "Jerarquía problema → mecanismo → resultado con pocos elementos explicativos.", "Símbolos, diagramas o comparaciones deben ser correctos y legibles.", "Usa curiosidad intelectual y claridad antes que exageración emocional."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "technology",
    label: "Tecnología",
    description: "Precisión, innovación y detalle digital.",
    previewAsset: "/styles/technology.webp",
    promptGuidelines: ["Tecnología o interfaz específica y plausible como protagonista.", "Materiales, reflejos y luz contemporáneos sin caer siempre en cian y púrpura.", "Profundidad limpia, precisión industrial y un beneficio visible.", "Evita circuitos aleatorios, hologramas ilegibles y robots genéricos."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "luxury",
    label: "Lujo",
    description: "Elegancia editorial y materiales refinados.",
    previewAsset: "/styles/luxury.webp",
    promptGuidelines: ["Dirección editorial contenida con materiales auténticos y detalle táctil.", "Luz selectiva, sombras ricas y espacio negativo calculado.", "Tipografía elegante con escala segura; evita dorado y negro como fórmula automática.", "La exclusividad debe sentirse en acabado, encuadre y rareza, no en ornamentos."],
    compatibleContentTypes: ALL_CONTENT_TYPES,
  },
  {
    id: "news",
    label: "Noticias",
    description: "Urgencia, autoridad y lectura rápida.",
    previewAsset: "/styles/news.webp",
    promptGuidelines: ["Hecho, persona o lugar verificable como foco informativo inmediato.", "Jerarquía editorial fuerte, urgencia controlada y contexto visual suficiente.", "Rojo puede señalar alerta, pero no debe dominar todas las noticias.", "Evita cintillos falsos, logos inventados, alarmismo y estética de canal genérico."],
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
    ?? (input.contentType === "thumbnail"
      ? "viral"
      : input.coverPlatform === "linkedin"
        ? "professional"
        : "professional");
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
