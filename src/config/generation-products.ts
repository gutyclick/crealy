import type {
  ContentType,
  GenerationFormat,
  GenerationPlatform,
  GenerationQuality,
  ProfileBackground,
  ProfileIntensity,
  ProfileMode,
} from "@/types/generation";

export type SafeArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ExportStrategy = "none" | "cover" | "contain" | "extend-background";

export type GenerationVariantDefinition = {
  id: GenerationFormat;
  label: string;
  shortLabel: string;
  description: string;
  width: number;
  height: number;
  requestedProviderSize: `${number}x${number}`;
  fallbackProviderSize: `${number}x${number}`;
  quality: GenerationQuality;
  creditCost: number;
  recommended?: boolean;
  safeArea: SafeArea;
  exportStrategy: ExportStrategy;
  platform?: GenerationPlatform;
  promptGuidelines: readonly string[];
  legacy?: boolean;
};

export type GenerationProductDefinition = {
  id: ContentType;
  label: string;
  fullLabel: string;
  description: string;
  icon: string;
  example: string;
  acceptsText: boolean;
  acceptsReferences: boolean;
  selectableQuality: boolean;
  platforms: readonly GenerationPlatform[];
  defaultPlatform?: GenerationPlatform;
  defaultVariant: GenerationFormat;
  variants: readonly GenerationVariantDefinition[];
};

const safe = (width: number, height: number, inset = 0.08): SafeArea => ({
  x: Math.round(width * inset),
  y: Math.round(height * inset),
  width: Math.round(width * (1 - inset * 2)),
  height: Math.round(height * (1 - inset * 2)),
});

export const GENERATION_PRODUCTS = [
  {
    id: "thumbnail",
    label: "Miniatura",
    fullLabel: "Miniatura de YouTube",
    description: "Miniaturas 16:9 optimizadas para destacar en YouTube.",
    icon: "monitor-play",
    example: "Una miniatura sobre productividad con un sujeto claro y un titular breve.",
    acceptsText: true,
    acceptsReferences: true,
    selectableQuality: true,
    platforms: ["youtube"],
    defaultPlatform: "youtube",
    defaultVariant: "thumbnail-standard",
    variants: [
      {
        id: "thumbnail-standard",
        label: "Estándar",
        shortLabel: "1280 × 720",
        description: "La opción ágil para explorar y publicar.",
        width: 1280,
        height: 720,
        requestedProviderSize: "1280x720",
        fallbackProviderSize: "1536x1024",
        quality: "standard",
        creditCost: 1,
        recommended: true,
        safeArea: safe(1280, 720),
        exportStrategy: "cover",
        platform: "youtube",
        promptGuidelines: ["Un solo foco dominante.", "Lectura inmediata en tamaño pequeño."],
        legacy: true,
      },
      {
        id: "thumbnail-high",
        label: "Alta calidad",
        shortLabel: "1920 × 1080",
        description: "Más detalle para la versión final.",
        width: 1920,
        height: 1080,
        requestedProviderSize: "1920x1088",
        fallbackProviderSize: "1536x1024",
        quality: "high",
        creditCost: 3,
        safeArea: safe(1920, 1080),
        exportStrategy: "cover",
        platform: "youtube",
        promptGuidelines: ["Un solo foco dominante.", "Detalle nítido y lectura inmediata en tamaño pequeño."],
      },
    ],
  },
  {
    id: "social-post",
    label: "Post",
    fullLabel: "Post para redes",
    description: "Piezas para feeds cuadrados o verticales.",
    icon: "image",
    example: "Un post promocional para una cafetería artesanal, cálido y editorial.",
    acceptsText: true,
    acceptsReferences: true,
    selectableQuality: true,
    platforms: ["instagram", "facebook", "linkedin", "x"],
    defaultPlatform: "instagram",
    defaultVariant: "post-square",
    variants: [
      {
        id: "post-square",
        label: "Cuadrado",
        shortLabel: "1080 × 1080",
        description: "Formato 1:1 para feeds.",
        width: 1080,
        height: 1080,
        requestedProviderSize: "1088x1088",
        fallbackProviderSize: "1024x1024",
        quality: "standard",
        creditCost: 1,
        recommended: true,
        safeArea: safe(1080, 1080),
        exportStrategy: "cover",
        promptGuidelines: ["Jerarquía clara incluso en móvil.", "Evita elementos importantes cerca de los bordes."],
      },
      {
        id: "post-portrait",
        label: "Vertical",
        shortLabel: "1080 × 1350",
        description: "Formato 4:5 con mayor presencia en el feed.",
        width: 1080,
        height: 1350,
        requestedProviderSize: "1088x1360",
        fallbackProviderSize: "1024x1536",
        quality: "standard",
        creditCost: 1,
        safeArea: safe(1080, 1350),
        exportStrategy: "cover",
        promptGuidelines: ["Composición vertical con lectura de arriba hacia abajo.", "Mantén el foco dentro del centro visual."],
      },
    ],
  },
  {
    id: "banner",
    label: "Banner",
    fullLabel: "Banner publicitario",
    description: "Piezas panorámicas para campañas y cabeceras.",
    icon: "rectangle-horizontal",
    example: "Un banner para una app de finanzas, moderno y con espacio negativo.",
    acceptsText: true,
    acceptsReferences: true,
    selectableQuality: true,
    platforms: [],
    defaultVariant: "banner-standard",
    variants: [
      {
        id: "banner-small", label: "Pequeño", shortLabel: "1024 × 512", description: "Ligero para web.", width: 1024, height: 512,
        requestedProviderSize: "1024x512", fallbackProviderSize: "1536x1024", quality: "standard", creditCost: 1,
        safeArea: safe(1024, 512), exportStrategy: "cover", promptGuidelines: ["Composición panorámica simple.", "Texto grande y poco contenido."],
      },
      {
        id: "banner-standard", label: "Estándar", shortLabel: "1536 × 768", description: "Equilibrio entre detalle y coste.", width: 1536, height: 768,
        requestedProviderSize: "1536x768", fallbackProviderSize: "1536x1024", quality: "high", creditCost: 2, recommended: true,
        safeArea: safe(1536, 768), exportStrategy: "cover", promptGuidelines: ["Jerarquía panorámica.", "Reserva aire alrededor del mensaje."],
      },
      {
        id: "banner-large", label: "Grande", shortLabel: "1920 × 1080", description: "Mayor resolución para campañas.", width: 1920, height: 1080,
        requestedProviderSize: "1920x1088", fallbackProviderSize: "1536x1024", quality: "high", creditCost: 3,
        safeArea: safe(1920, 1080), exportStrategy: "cover", promptGuidelines: ["Detalle alto.", "Mantén el mensaje central y adaptable."],
      },
      {
        id: "banner-2k", label: "2K", shortLabel: "2560 × 1440", description: "Máster 2K para exportaciones exigentes.", width: 2560, height: 1440,
        requestedProviderSize: "2560x1440", fallbackProviderSize: "1536x1024", quality: "high", creditCost: 4,
        safeArea: safe(2560, 1440), exportStrategy: "cover", promptGuidelines: ["Máximo detalle.", "Composición adaptable a recortes."],
      },
    ],
  },
  {
    id: "social-cover",
    label: "Portada",
    fullLabel: "Portada para plataforma",
    description: "Cabeceras con las medidas y zonas seguras de cada red.",
    icon: "panels-top-left",
    example: "Una portada para un podcast de negocios, sobria y cinematográfica.",
    acceptsText: true,
    acceptsReferences: true,
    selectableQuality: true,
    platforms: ["youtube", "facebook", "x", "linkedin"],
    defaultPlatform: "youtube",
    defaultVariant: "cover-youtube",
    variants: [
      {
        id: "cover-youtube", label: "YouTube", shortLabel: "2560 × 1440", description: "Portada de canal.", width: 2560, height: 1440,
        requestedProviderSize: "2560x1440", fallbackProviderSize: "1536x1024", quality: "high", creditCost: 3, platform: "youtube",
        safeArea: { x: 663, y: 551, width: 1235, height: 338 }, exportStrategy: "extend-background",
        promptGuidelines: ["Mantén texto, logos, rostros y elementos esenciales dentro de la zona segura central.", "Usa los extremos como extensión natural del fondo."],
      },
      {
        id: "cover-facebook", label: "Facebook", shortLabel: "1702 × 630", description: "Portada de página o perfil.", width: 1702, height: 630,
        requestedProviderSize: "1712x640", fallbackProviderSize: "1536x1024", quality: "high", creditCost: 2, platform: "facebook",
        safeArea: { x: 205, y: 64, width: 1292, height: 502 }, exportStrategy: "cover",
        promptGuidelines: ["Reserva el extremo inferior izquierdo para el avatar.", "Mantén texto y marca en la zona central."],
      },
      {
        id: "cover-x", label: "X", shortLabel: "1500 × 500", description: "Cabecera de perfil.", width: 1500, height: 500,
        requestedProviderSize: "1504x512", fallbackProviderSize: "1536x1024", quality: "high", creditCost: 2, platform: "x",
        safeArea: { x: 180, y: 45, width: 1170, height: 360 }, exportStrategy: "cover",
        promptGuidelines: ["Reserva el extremo inferior izquierdo para el avatar.", "Extiende el fondo a ambos lados."],
      },
      {
        id: "cover-linkedin", label: "LinkedIn", shortLabel: "1584 × 396", description: "Portada de perfil.", width: 1584, height: 396,
        requestedProviderSize: "1584x400", fallbackProviderSize: "1536x1024", quality: "high", creditCost: 2, platform: "linkedin",
        safeArea: { x: 245, y: 42, width: 1180, height: 300 }, exportStrategy: "cover",
        promptGuidelines: ["Reserva el extremo inferior izquierdo para el avatar.", "Mantén una composición sobria y legible."],
      },
    ],
  },
  {
    id: "story",
    label: "Historia",
    fullLabel: "Historia vertical",
    description: "Creatividades 9:16 para historias y TikTok.",
    icon: "smartphone",
    example: "Una historia de lanzamiento con un mensaje breve y una llamada a la acción.",
    acceptsText: true,
    acceptsReferences: true,
    selectableQuality: true,
    platforms: ["instagram", "facebook", "tiktok", "generic"],
    defaultPlatform: "instagram",
    defaultVariant: "story-standard",
    variants: [
      {
        id: "story-standard", label: "Estándar", shortLabel: "1080 × 1920", description: "Lista para publicar.", width: 1080, height: 1920,
        requestedProviderSize: "1088x1920", fallbackProviderSize: "1024x1536", quality: "standard", creditCost: 2, recommended: true,
        safeArea: { x: 86, y: 230, width: 908, height: 1460 }, exportStrategy: "cover",
        promptGuidelines: ["Composición vertical 9:16.", "Mantén texto y rostros fuera de las franjas superior e inferior."],
      },
      {
        id: "story-high", label: "Alta calidad", shortLabel: "1080 × 1920", description: "Máster superior para más detalle.", width: 1080, height: 1920,
        requestedProviderSize: "1536x2736", fallbackProviderSize: "1024x1536", quality: "high", creditCost: 3,
        safeArea: { x: 86, y: 230, width: 908, height: 1460 }, exportStrategy: "cover",
        promptGuidelines: ["Composición vertical 9:16 con detalle alto.", "Mantén texto y rostros fuera de las franjas superior e inferior."],
        legacy: true,
      },
    ],
  },
  {
    id: "profile-image",
    label: "Perfil",
    fullLabel: "Imagen de perfil",
    description: "Imagen 1:1 preparada para avatares de redes sociales.",
    icon: "circle-user-round",
    example: "Un retrato profesional de estudio que conserve fielmente la identidad.",
    acceptsText: false,
    acceptsReferences: true,
    selectableQuality: true,
    platforms: ["instagram", "facebook", "x", "linkedin"],
    defaultPlatform: "instagram",
    defaultVariant: "profile-master",
    variants: [
      {
        id: "profile-master", label: "Perfil social", shortLabel: "800 × 800", description: "Formato 1:1 optimizado para avatares de redes.", width: 800, height: 800,
        requestedProviderSize: "1024x1024", fallbackProviderSize: "1024x1024", quality: "high", creditCost: 2, recommended: true,
        safeArea: { x: 96, y: 96, width: 608, height: 608 }, exportStrategy: "cover",
        promptGuidelines: ["Centra el sujeto o símbolo dentro del círculo seguro.", "Conserva identidad, rasgos, geometría y colores de marca."],
      },
    ],
  },
] as const satisfies readonly GenerationProductDefinition[];

type ResolvedVariant = GenerationVariantDefinition & { contentType: ContentType };

const PRODUCT_BY_ID = new Map<ContentType, GenerationProductDefinition>(
  GENERATION_PRODUCTS.map((product) => [product.id, product]),
);
const VARIANT_BY_ID = new Map<GenerationFormat, ResolvedVariant>(
  GENERATION_PRODUCTS.flatMap((product) =>
    product.variants.map((variant) => [variant.id, { ...variant, contentType: product.id }] as const),
  ),
);

export const LEGACY_CONTENT_TYPE_MAP = {
  "youtube-thumbnail": "thumbnail",
} as const;

export const LEGACY_VARIANT_MAP: Partial<Record<GenerationFormat, GenerationFormat>> = {
  "youtube-16-9": "thumbnail-high",
  "youtube-cover": "cover-youtube",
  "social-square": "post-square",
  "social-portrait": "post-portrait",
  "banner-3-1": "banner-standard",
  "facebook-cover": "cover-facebook",
  "x-cover": "cover-x",
  "linkedin-cover": "cover-linkedin",
  "social-cover-panorama": "cover-facebook",
};

export function normalizeContentType(value: string): ContentType | null {
  const normalized = value === "youtube-thumbnail" ? "thumbnail" : value;
  return PRODUCT_BY_ID.has(normalized as ContentType) ? (normalized as ContentType) : null;
}

export function normalizeGenerationVariant(value: string): GenerationFormat | null {
  const legacy = LEGACY_VARIANT_MAP[value as GenerationFormat];
  const normalized = legacy ?? (value as GenerationFormat);
  return VARIANT_BY_ID.has(normalized) ? normalized : null;
}

export function getGenerationProduct(contentType: ContentType): GenerationProductDefinition {
  return PRODUCT_BY_ID.get(contentType)!;
}

export function getGenerationVariant(variant: GenerationFormat): ResolvedVariant | null {
  const normalized = normalizeGenerationVariant(variant);
  return normalized ? VARIANT_BY_ID.get(normalized)! : null;
}

export function getVariantForPlatform(contentType: ContentType, platform?: GenerationPlatform) {
  const product = getGenerationProduct(contentType);
  return product.variants.find((variant) => variant.platform === platform)
    ?? product.variants.find((variant) => variant.id === product.defaultVariant)!;
}

export function getVariantForQuality(contentType: ContentType, quality: GenerationQuality) {
  const product = getGenerationProduct(contentType);
  return product.variants.find((variant) => getSupportedQualities(variant).includes(quality))
    ?? product.variants.find((variant) => variant.id === product.defaultVariant)!;
}

export function getSelectableVariants(contentType: ContentType) {
  return getGenerationProduct(contentType).variants.filter((variant) => !variant.legacy);
}

export function getSupportedQualities(
  variant: GenerationVariantDefinition,
): readonly GenerationQuality[] {
  return variant.id === "cover-youtube"
    ? (["high"] as const)
    : (["standard", "high"] as const);
}

export function getDefaultQuality(variant: GenerationVariantDefinition): GenerationQuality {
  return getSupportedQualities(variant).includes("standard") ? "standard" : "high";
}

export function getVariantCreditCost(
  variant: GenerationVariantDefinition,
  quality: GenerationQuality,
) {
  if (!getSupportedQualities(variant).includes(quality)) {
    throw new Error("invalid_generation_quality");
  }
  if (quality === variant.quality) return variant.creditCost;
  return quality === "high"
    ? variant.creditCost + 1
    : Math.max(1, variant.creditCost - 1);
}

export const PROFILE_MODES: readonly { id: ProfileMode; label: string }[] = [
  { id: "enhance", label: "Mejorar" },
  { id: "professional", label: "Profesional" },
  { id: "black-and-white", label: "Blanco y negro" },
  { id: "creative", label: "Creativo" },
  { id: "illustrated", label: "Ilustrado" },
  { id: "studio", label: "Estudio" },
  { id: "brand", label: "Marca" },
];

export const PROFILE_INTENSITIES: readonly { id: ProfileIntensity; label: string }[] = [
  { id: "subtle", label: "Sutil" },
  { id: "balanced", label: "Equilibrada" },
  { id: "creative", label: "Creativa" },
];

export const PROFILE_BACKGROUNDS: readonly { id: ProfileBackground; label: string }[] = [
  { id: "auto", label: "Automático" },
  { id: "white", label: "Blanco" },
  { id: "black", label: "Negro" },
  { id: "neutral", label: "Neutro" },
  { id: "custom", label: "Color personalizado" },
  { id: "gradient", label: "Gradiente" },
];
