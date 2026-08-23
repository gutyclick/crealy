import {
  PROFILE_BACKGROUNDS,
  PROFILE_INTENSITIES,
  PROFILE_MODES,
  getGenerationProduct,
  getGenerationVariant,
  getDefaultQuality,
  getSupportedQualities,
  normalizeContentType,
  normalizeGenerationVariant,
} from "@/config/generation-products";
import {
  GENERATION_COLORS,
  GENERATION_STYLES,
  MAX_GENERATION_REFERENCE_IMAGES,
} from "@/config/generation";
import { isVisualStyleCompatible } from "@/config/visual-styles";
import { THUMBNAIL_PRESETS, THUMBNAIL_TEXT_MODES } from "@/config/thumbnail-creation";
import {
  DEFAULT_RECREATE_PRESERVATION,
  MAX_RECREATE_REFERENCE_IMAGES,
  RECREATE_REFERENCE_ROLES,
} from "@/config/recreate";
import { validateColorPalette } from "@/lib/colors/validate-color-palette";
import type {
  ColorPreference,
  GenerationInput,
  GenerationPlatform,
  GenerationQuality,
  GenerationStyle,
  GenerationTextMode,
  ProfileBackground,
  ProfileIntensity,
  ProfileMode,
  ThumbnailPreset,
  ThumbnailTextMode,
  StyleConsistency,
} from "@/types/generation";
import { isRecreateCategory } from "@/lib/recreate/reference";
import type {
  RecreateBlueprint,
  RecreateElementAnalysis,
  RecreateElementKind,
  RecreateFocus,
  RecreateGoal,
  RecreatePreservation,
  RecreateReferenceRole,
  RecreateSimilarity,
} from "@/types/recreate";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STYLES = new Set<string>(GENERATION_STYLES.map((item) => item.id));
const COLORS = new Set<string>(GENERATION_COLORS.map((item) => item.id));
const PROFILE_MODE_IDS = new Set(PROFILE_MODES.map((item) => item.id));
const PROFILE_INTENSITY_IDS = new Set(PROFILE_INTENSITIES.map((item) => item.id));
const PROFILE_BACKGROUND_IDS = new Set(PROFILE_BACKGROUNDS.map((item) => item.id));
const THUMBNAIL_PRESET_IDS = new Set(THUMBNAIL_PRESETS.map((item) => item.id));
const THUMBNAIL_TEXT_MODE_IDS = new Set(THUMBNAIL_TEXT_MODES.map((item) => item.id));
const RECREATE_REFERENCE_ROLE_IDS = new Set(
  RECREATE_REFERENCE_ROLES.map((item) => item.id),
);
const RECREATE_ELEMENT_KINDS = new Set<RecreateElementKind>([
  "person",
  "product",
  "object",
  "background",
  "mixed",
]);

type ValidationResult =
  | { success: true; data: GenerationInput }
  | { success: false; fields: Record<string, string> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateGenerationInput(rawInput: unknown): ValidationResult {
  if (!isRecord(rawInput)) {
    return { success: false, fields: { form: "La solicitud no tiene un formato válido." } };
  }

  const fields: Record<string, string> = {};
  const description =
    typeof rawInput.description === "string" ? rawInput.description.trim() : "";
  const primaryText =
    typeof rawInput.primaryText === "string" ? rawInput.primaryText.trim() : "";
  const contentType =
    typeof rawInput.contentType === "string"
      ? normalizeContentType(rawInput.contentType)
      : null;
  const rawVariant =
    typeof rawInput.variant === "string"
      ? rawInput.variant
      : typeof rawInput.format === "string"
        ? rawInput.format
        : "";
  const variant = normalizeGenerationVariant(rawVariant);
  const isLegacyVariant = Boolean(variant && variant !== rawVariant);
  const definition = variant ? getGenerationVariant(variant) : null;
  const product = contentType ? getGenerationProduct(contentType) : null;
  const rawPlatform =
    typeof rawInput.platform === "string"
      ? rawInput.platform
      : typeof rawInput.coverPlatform === "string"
        ? rawInput.coverPlatform
        : undefined;
  const platform = rawPlatform as GenerationPlatform | undefined;
  const style = rawInput.style === "auto" ? "automatic" : rawInput.style;
  const colorPreference = rawInput.colorPreference;
  const requestedQuality =
    contentType === "thumbnail" || rawInput.quality === "fast"
      ? "standard"
      : rawInput.quality;
  const quality = requestedQuality ?? (definition ? getDefaultQuality(definition) : undefined);
  const brandStyleId = typeof rawInput.brandStyleId === "string" ? rawInput.brandStyleId : undefined;
  const creationMode = rawInput.creationMode === "recreate" ? "recreate" : "create";
  const recreateSimilarity: RecreateSimilarity = rawInput.recreateSimilarity === "inspired" || rawInput.recreateSimilarity === "very_similar" ? rawInput.recreateSimilarity : "similar";
  const recreateFocus: RecreateFocus = ["subject", "text", "atmosphere"].includes(String(rawInput.recreateFocus)) ? rawInput.recreateFocus as RecreateFocus : "composition";
  const recreateGoal: RecreateGoal = ["clean", "premium", "bold"].includes(String(rawInput.recreateGoal)) ? rawInput.recreateGoal as RecreateGoal : "performance";
  let recreateBlueprint: RecreateBlueprint | undefined;
  const styleConsistency = rawInput.styleConsistency === "flexible" || rawInput.styleConsistency === "strict" ? rawInput.styleConsistency : "balanced";
  if (brandStyleId && !UUID_PATTERN.test(brandStyleId)) fields.brandStyleId = "El estilo guardado no es válido.";
  if (creationMode === "recreate") {
    if (!contentType || !isRecreateCategory(contentType)) fields.creationMode = "Recreate no está disponible para esta categoría.";
    const candidate = rawInput.recreateBlueprint;
    if (!isRecord(candidate) || candidate.category !== contentType || typeof candidate.composition !== "string" || typeof candidate.hierarchy !== "string" || typeof candidate.visualStyle !== "string") {
      fields.recreateBlueprint = "Analiza una referencia antes de generar.";
    } else {
      const stringValue = (key: string) => typeof candidate[key] === "string" ? String(candidate[key]).slice(0, 500) : "";
      const stringArray = (key: string, limit: number) => Array.isArray(candidate[key]) ? (candidate[key] as unknown[]).filter((value): value is string => typeof value === "string").slice(0, limit) : [];
      recreateBlueprint = { category: contentType as RecreateBlueprint["category"], composition: stringValue("composition"), hierarchy: stringValue("hierarchy"), visualStyle: stringValue("visualStyle"), background: stringValue("background"), emotion: stringValue("emotion"), textDensity: stringValue("textDensity"), subjectScale: stringValue("subjectScale"), colorPalette: stringArray("colorPalette", 5), focalElements: stringArray("focalElements", 8), replaceableElements: stringArray("replaceableElements", 8) };
    }
  }

  if (description.length < (contentType === "thumbnail" ? 3 : 10)) {
    fields.description = contentType === "thumbnail"
      ? "Cuéntanos de qué trata el video."
      : "Describe tu idea con al menos 10 caracteres.";
  } else if (description.length > 1_500) {
    fields.description = "La descripción no puede superar 1.500 caracteres.";
  }
  if (primaryText.length > 120) {
    fields.primaryText = "El texto principal no puede superar 120 caracteres.";
  }
  if (!contentType || !product) fields.contentType = "Elige un tipo de contenido válido.";
  if (!variant || !definition) fields.variant = "Elige una variante válida.";
  if (product && definition && definition.contentType !== product.id) {
    fields.variant = "La variante no corresponde al tipo de contenido.";
  }

  if (product?.platforms.length) {
    if (!platform || !product.platforms.includes(platform)) {
      fields.platform = "Elige una plataforma compatible.";
    }
  } else if (platform) {
    fields.platform = "Este producto no necesita una plataforma.";
  }
  if (definition?.platform && platform !== definition.platform) {
    fields.variant = "La variante no corresponde a la plataforma.";
  }
  if (requestedQuality !== undefined && requestedQuality !== "standard" && requestedQuality !== "high") {
    fields.quality = "Elige un nivel de calidad válido.";
  }
  if (
    definition &&
    !isLegacyVariant &&
    quality &&
    !getSupportedQualities(definition).includes(quality as GenerationQuality)
  ) {
    fields.quality = "La calidad no corresponde a la variante seleccionada.";
  }
  if (typeof style !== "string" || !STYLES.has(style as GenerationStyle)) {
    fields.style = "Elige un estilo visual válido.";
  } else if (
    product &&
    !isVisualStyleCompatible(style as GenerationStyle, product.id)
  ) {
    fields.style = "Ese estilo no está disponible para este tipo de contenido.";
  }
  if (typeof colorPreference !== "string" || !COLORS.has(colorPreference as ColorPreference)) {
    fields.colorPreference = "Elige una preferencia de color válida.";
  }
  if (typeof rawInput.clientRequestId !== "string" || !UUID_PATTERN.test(rawInput.clientRequestId)) {
    fields.form = "No pudimos identificar esta solicitud. Inténtalo de nuevo.";
  }
  if (
    rawInput.projectId !== undefined &&
    (typeof rawInput.projectId !== "string" || !UUID_PATTERN.test(rawInput.projectId))
  ) {
    fields.form = "El proyecto seleccionado no es válido.";
  }
  if (
    rawInput.parentGenerationId !== undefined &&
    (typeof rawInput.parentGenerationId !== "string" || !UUID_PATTERN.test(rawInput.parentGenerationId))
  ) {
    fields.form = "La miniatura de origen no es válida.";
  }

  let referenceUploadIds: string[] | undefined;
  const maxReferenceImages =
    creationMode === "recreate"
      ? MAX_RECREATE_REFERENCE_IMAGES
      : MAX_GENERATION_REFERENCE_IMAGES;
  if (rawInput.referenceUploadIds !== undefined) {
    if (
      !Array.isArray(rawInput.referenceUploadIds) ||
      rawInput.referenceUploadIds.length > maxReferenceImages ||
      rawInput.referenceUploadIds.some((id) => typeof id !== "string" || !UUID_PATTERN.test(id))
    ) {
      fields.referenceUploadIds = `Puedes usar hasta ${maxReferenceImages} imágenes de referencia válidas.`;
    } else if (new Set(rawInput.referenceUploadIds).size !== rawInput.referenceUploadIds.length) {
      fields.referenceUploadIds = "No repitas una imagen de referencia.";
    } else if (rawInput.referenceUploadIds.length) {
      referenceUploadIds = rawInput.referenceUploadIds as string[];
    }
  }
  if (creationMode === "recreate" && !referenceUploadIds?.length) fields.referenceUploadIds = "Añade una referencia para recrear.";

  let recreateReferenceRoles: RecreateReferenceRole[] | undefined;
  let recreateElementAnalyses: Array<RecreateElementAnalysis | null> | undefined;
  let recreatePreservation: RecreatePreservation | undefined;
  if (creationMode === "recreate") {
    const supportingCount = Math.max(0, (referenceUploadIds?.length ?? 0) - 1);
    if (rawInput.recreateReferenceRoles === undefined) {
      recreateReferenceRoles = Array.from(
        { length: supportingCount },
        (_, index) => index === 0 ? "protagonist" : "supporting",
      );
    } else if (
      !Array.isArray(rawInput.recreateReferenceRoles) ||
      rawInput.recreateReferenceRoles.length !== supportingCount ||
      rawInput.recreateReferenceRoles.some(
        (role) =>
          typeof role !== "string" ||
          !RECREATE_REFERENCE_ROLE_IDS.has(role as RecreateReferenceRole),
      )
    ) {
      fields.recreateReferenceRoles =
        "Define un papel válido para cada imagen adicional.";
    } else {
      recreateReferenceRoles =
        rawInput.recreateReferenceRoles as RecreateReferenceRole[];
    }

    const analyses = rawInput.recreateElementAnalyses;
    if (analyses === undefined) {
      recreateElementAnalyses = Array.from({ length: supportingCount }, () => null);
    } else if (
      !Array.isArray(analyses) ||
      analyses.length !== supportingCount ||
      analyses.some((analysis) => {
        if (analysis === null) return false;
        if (!isRecord(analysis)) return true;
        return (
          typeof analysis.kind !== "string" ||
          !RECREATE_ELEMENT_KINDS.has(analysis.kind as RecreateElementKind) ||
          typeof analysis.recommendedRole !== "string" ||
          !RECREATE_REFERENCE_ROLE_IDS.has(
            analysis.recommendedRole as RecreateReferenceRole,
          ) ||
          typeof analysis.faceCount !== "number" ||
          !Number.isInteger(analysis.faceCount) ||
          analysis.faceCount < 0 ||
          analysis.faceCount > 8 ||
          typeof analysis.primarySubject !== "string" ||
          typeof analysis.placementGuidance !== "string" ||
          !Array.isArray(analysis.identityAnchors) ||
          !Array.isArray(analysis.warnings)
        );
      })
    ) {
      fields.recreateElementAnalyses =
        "La lectura opcional de uno de los elementos no es válida.";
    } else {
      recreateElementAnalyses = (analyses as Array<RecreateElementAnalysis | null>).map(
        (analysis) => analysis ? ({
          kind: analysis.kind,
          recommendedRole: analysis.recommendedRole,
          faceCount: analysis.faceCount,
          primarySubject: analysis.primarySubject.slice(0, 240),
          identityAnchors: analysis.identityAnchors
            .filter((value): value is string => typeof value === "string")
            .slice(0, 8)
            .map((value) => value.slice(0, 160)),
          placementGuidance: analysis.placementGuidance.slice(0, 320),
          warnings: analysis.warnings
            .filter((value): value is string => typeof value === "string")
            .slice(0, 5)
            .map((value) => value.slice(0, 160)),
        }) : null,
      );
    }

    const preservationCandidate = rawInput.recreatePreservation;
    if (preservationCandidate === undefined) {
      recreatePreservation = { ...DEFAULT_RECREATE_PRESERVATION };
    } else if (!isRecord(preservationCandidate)) {
      fields.recreatePreservation =
        "Elige opciones válidas para conservar la referencia.";
    } else if (
      Object.keys(DEFAULT_RECREATE_PRESERVATION).some(
        (key) => typeof preservationCandidate[key] !== "boolean",
      )
    ) {
      fields.recreatePreservation =
        "Elige opciones válidas para conservar la referencia.";
    } else {
      recreatePreservation = Object.fromEntries(
        Object.keys(DEFAULT_RECREATE_PRESERVATION).map((key) => [
          key,
          preservationCandidate[key],
        ]),
      ) as RecreatePreservation;
    }
  }

  let customColors: string[] | undefined;
  if (colorPreference === "custom") {
    const palette = validateColorPalette(rawInput.customColors);
    if (!palette.success) fields.customColors = palette.error;
    else customColors = palette.colors;
  }

  let profileMode: ProfileMode | undefined;
  let profileIntensity: ProfileIntensity | undefined;
  let profileBackground: ProfileBackground | undefined;
  if (contentType === "profile-image") {
    profileMode =
      typeof rawInput.profileMode === "string" &&
      PROFILE_MODE_IDS.has(rawInput.profileMode as ProfileMode)
        ? (rawInput.profileMode as ProfileMode)
        : undefined;
    profileIntensity =
      typeof rawInput.profileIntensity === "string" &&
      PROFILE_INTENSITY_IDS.has(rawInput.profileIntensity as ProfileIntensity)
        ? (rawInput.profileIntensity as ProfileIntensity)
        : undefined;
    profileBackground =
      typeof rawInput.profileBackground === "string" &&
      PROFILE_BACKGROUND_IDS.has(rawInput.profileBackground as ProfileBackground)
        ? (rawInput.profileBackground as ProfileBackground)
        : undefined;
    if (!profileMode) fields.profileMode = "Elige un modo de retrato.";
    if (!profileIntensity) fields.profileIntensity = "Elige la intensidad del cambio.";
    if (!profileBackground) fields.profileBackground = "Elige un fondo.";
  }

  const rawTextMode = typeof rawInput.textMode === "string"
    ? rawInput.textMode
    : typeof rawInput.thumbnailTextMode === "string"
      ? rawInput.thumbnailTextMode
      : undefined;
  let textMode: GenerationTextMode = "none";
  if (product?.acceptsText) {
    if (!rawTextMode || !THUMBNAIL_TEXT_MODE_IDS.has(rawTextMode as ThumbnailTextMode)) {
      fields.textMode = "Indica si quieres texto visible en el diseño.";
    } else {
      textMode = rawTextMode as GenerationTextMode;
    }
    if (textMode === "custom" && !primaryText) {
      fields.primaryText = "Escribe el texto exacto que debe aparecer en el diseño.";
    }
  }

  let videoTitle: string | undefined;
  let thumbnailPreset: ThumbnailPreset | undefined;
  let thumbnailTextMode: ThumbnailTextMode | undefined;
  if (contentType === "thumbnail") {
    videoTitle = typeof rawInput.videoTitle === "string"
      ? rawInput.videoTitle.trim()
      : undefined;
    if (videoTitle && videoTitle.length > 240) {
      fields.videoTitle = "El título no puede superar 240 caracteres.";
    }
    thumbnailPreset =
      typeof rawInput.thumbnailPreset === "string" &&
      THUMBNAIL_PRESET_IDS.has(rawInput.thumbnailPreset as ThumbnailPreset)
        ? rawInput.thumbnailPreset as ThumbnailPreset
        : "impactful";
    thumbnailTextMode = textMode;
    if (thumbnailTextMode === "custom" && primaryText.trim().split(/\s+/).length > 5) {
      fields.primaryText = "Usa un máximo de cinco palabras.";
    }
  }

  if (Object.keys(fields).length || !contentType || !variant || !definition || !platform && product?.platforms.length) {
    return { success: false, fields };
  }

  return {
    success: true,
    data: {
      clientRequestId: rawInput.clientRequestId as string,
      ...(typeof rawInput.projectId === "string" ? { projectId: rawInput.projectId } : {}),
      contentType,
      ...(platform ? { platform } : {}),
      ...(contentType === "social-cover" ? { coverPlatform: platform as GenerationInput["coverPlatform"] } : {}),
      description,
      ...(primaryText && product?.acceptsText && textMode === "custom" ? { primaryText } : {}),
      textMode,
      style: style as GenerationStyle,
      colorPreference: colorPreference as ColorPreference,
      ...(customColors ? { customColors } : {}),
      variant,
      format: variant,
      quality: quality as GenerationQuality,
      ...(referenceUploadIds ? { referenceUploadIds } : {}),
      ...(profileMode ? { profileMode } : {}),
      ...(profileIntensity ? { profileIntensity } : {}),
      ...(profileBackground ? { profileBackground } : {}),
      ...(typeof rawInput.showSafeArea === "boolean" ? { showSafeArea: rawInput.showSafeArea } : {}),
      ...(videoTitle ? { videoTitle } : {}),
      ...(thumbnailPreset ? { thumbnailPreset } : {}),
      ...(thumbnailTextMode ? { thumbnailTextMode } : {}),
      ...(rawInput.generationIntent === "variation" || rawInput.generationIntent === "additional_concept"
        ? { generationIntent: rawInput.generationIntent }
        : { generationIntent: "initial" }),
      ...(typeof rawInput.parentGenerationId === "string"
        ? { parentGenerationId: rawInput.parentGenerationId }
        : {}),
      ...(brandStyleId ? { brandStyleId, styleConsistency: styleConsistency as StyleConsistency } : {}),
      creationMode,
      ...(creationMode === "recreate" && recreateBlueprint
        ? {
            recreateSimilarity,
            recreateBlueprint,
            recreateFocus,
            recreateGoal,
            recreateReferenceRoles,
            recreateElementAnalyses,
            recreatePreservation,
          }
        : {}),
    },
  };
}
