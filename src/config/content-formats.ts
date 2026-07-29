import type {
  ContentType,
  CoverPlatform,
  GenerationFormat,
} from "@/types/generation";

export type SafeArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ExportStrategy =
  | "none"
  | "cover"
  | "contain"
  | "extend-background";

export type PlatformCoverDefinition = {
  id: CoverPlatform;
  format: GenerationFormat;
  label: string;
  description: string;
  exportWidth: number;
  exportHeight: number;
  requestedOpenAISize: `${number}x${number}`;
  fallbackOpenAISize: `${number}x${number}`;
  requiredQuality: "high";
  safeArea: SafeArea;
  avatarObstruction?: SafeArea;
  promptGuidelines: readonly string[];
  previewTemplate: string;
  exportStrategy: ExportStrategy;
};

export const PLATFORM_COVERS = {
  youtube: {
    id: "youtube",
    format: "youtube-cover",
    label: "YouTube",
    description: "Portada de canal · 2560 × 1440",
    exportWidth: 2560,
    exportHeight: 1440,
    requestedOpenAISize: "2560x1440",
    fallbackOpenAISize: "1920x1088",
    requiredQuality: "high",
    safeArea: { x: 663, y: 551, width: 1235, height: 338 },
    promptGuidelines: [
      "Mantén texto, logos, rostros y elementos esenciales dentro de la zona segura central.",
      "Usa los extremos como extensión visual del fondo.",
      "Evita información importante cerca de los bordes.",
    ],
    previewTemplate: "youtube-channel-cover",
    exportStrategy: "extend-background",
  },
  facebook: {
    id: "facebook",
    format: "facebook-cover",
    label: "Facebook",
    description: "Portada de página o perfil · 1702 × 630",
    exportWidth: 1702,
    exportHeight: 630,
    requestedOpenAISize: "1702x630",
    fallbackOpenAISize: "1712x640",
    requiredQuality: "high",
    safeArea: { x: 205, y: 64, width: 1292, height: 502 },
    avatarObstruction: { x: 24, y: 378, width: 210, height: 210 },
    promptGuidelines: [
      "Diseña exclusivamente una portada de página o perfil.",
      "Reserva el extremo inferior izquierdo ante una posible superposición del avatar.",
      "Mantén texto y marca dentro de la zona central.",
    ],
    previewTemplate: "facebook-page-profile-cover",
    exportStrategy: "cover",
  },
  x: {
    id: "x",
    format: "x-cover",
    label: "X",
    description: "Cabecera de perfil · 1500 × 500",
    exportWidth: 1500,
    exportHeight: 500,
    requestedOpenAISize: "1500x500",
    fallbackOpenAISize: "1536x512",
    requiredQuality: "high",
    safeArea: { x: 180, y: 45, width: 1170, height: 360 },
    avatarObstruction: { x: 40, y: 315, width: 180, height: 180 },
    promptGuidelines: [
      "Mantén texto y elementos esenciales lejos de los bordes.",
      "Reserva el extremo inferior izquierdo ante la superposición del avatar.",
      "Extiende el fondo de forma natural a ambos lados.",
    ],
    previewTemplate: "x-profile-cover",
    exportStrategy: "cover",
  },
  linkedin: {
    id: "linkedin",
    format: "linkedin-cover",
    label: "LinkedIn",
    description: "Portada de perfil · 1584 × 396",
    exportWidth: 1584,
    exportHeight: 396,
    requestedOpenAISize: "1584x396",
    fallbackOpenAISize: "1536x512",
    requiredQuality: "high",
    safeArea: { x: 245, y: 42, width: 1180, height: 300 },
    avatarObstruction: { x: 35, y: 205, width: 205, height: 205 },
    promptGuidelines: [
      "Reserva una franja segura para texto, marca y elemento principal.",
      "Evita el extremo inferior izquierdo por la posible interferencia del avatar.",
      "Mantén una composición sobria y legible.",
    ],
    previewTemplate: "linkedin-profile-cover",
    exportStrategy: "cover",
  },
} as const satisfies Record<CoverPlatform, PlatformCoverDefinition>;

export type ContentFormatDefinition = {
  id: GenerationFormat;
  label: string;
  shortLabel: string;
  contentType: ContentType;
  requestedOpenAISize: `${number}x${number}`;
  exportWidth: number;
  exportHeight: number;
  safeArea: SafeArea;
  exportStrategy: ExportStrategy;
  legacy?: boolean;
};

export const CONTENT_FORMATS = {
  "youtube-16-9": {
    id: "youtube-16-9",
    label: "YouTube · 1920 × 1080",
    shortLabel: "YouTube 16:9",
    contentType: "youtube-thumbnail",
    requestedOpenAISize: "1920x1088",
    exportWidth: 1920,
    exportHeight: 1080,
    safeArea: { x: 154, y: 86, width: 1612, height: 908 },
    exportStrategy: "cover",
  },
  "social-square": {
    id: "social-square",
    label: "Cuadrado · 1024 × 1024",
    shortLabel: "1:1",
    contentType: "social-post",
    requestedOpenAISize: "1024x1024",
    exportWidth: 1024,
    exportHeight: 1024,
    safeArea: { x: 82, y: 82, width: 860, height: 860 },
    exportStrategy: "none",
  },
  "social-portrait": {
    id: "social-portrait",
    label: "Vertical · 1024 × 1280",
    shortLabel: "4:5",
    contentType: "social-post",
    requestedOpenAISize: "1024x1280",
    exportWidth: 1024,
    exportHeight: 1280,
    safeArea: { x: 82, y: 102, width: 860, height: 1076 },
    exportStrategy: "none",
  },
  "banner-3-1": {
    id: "banner-3-1",
    label: "Banner · 1536 × 512",
    shortLabel: "Banner 3:1",
    contentType: "banner",
    requestedOpenAISize: "1536x512",
    exportWidth: 1536,
    exportHeight: 512,
    safeArea: { x: 154, y: 51, width: 1228, height: 410 },
    exportStrategy: "none",
  },
  "youtube-cover": { ...PLATFORM_COVERS.youtube, id: "youtube-cover", shortLabel: "YouTube", contentType: "social-cover" },
  "facebook-cover": { ...PLATFORM_COVERS.facebook, id: "facebook-cover", shortLabel: "Facebook", contentType: "social-cover" },
  "x-cover": { ...PLATFORM_COVERS.x, id: "x-cover", shortLabel: "X", contentType: "social-cover" },
  "linkedin-cover": { ...PLATFORM_COVERS.linkedin, id: "linkedin-cover", shortLabel: "LinkedIn", contentType: "social-cover" },
  "social-cover-panorama": {
    id: "social-cover-panorama",
    label: "Portada anterior · 1536 × 640",
    shortLabel: "Anterior",
    contentType: "social-cover",
    requestedOpenAISize: "1536x640",
    exportWidth: 1536,
    exportHeight: 640,
    safeArea: { x: 154, y: 64, width: 1228, height: 512 },
    exportStrategy: "none",
    legacy: true,
  },
} as const satisfies Record<GenerationFormat, ContentFormatDefinition>;

export const COVER_PLATFORMS = Object.values(PLATFORM_COVERS);

export function getContentFormat(format: GenerationFormat) {
  return CONTENT_FORMATS[format];
}

export function getPlatformCover(platform: CoverPlatform) {
  return PLATFORM_COVERS[platform];
}

