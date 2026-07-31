import {
  PROFILE_BACKGROUNDS,
  PROFILE_INTENSITIES,
  PROFILE_MODES,
  getGenerationProduct,
  getGenerationVariant,
  normalizeContentType,
  normalizeGenerationVariant,
} from "@/config/generation-products";
import { GENERATION_COLORS, GENERATION_STYLES } from "@/config/generation";
import { isVisualStyleCompatible } from "@/config/visual-styles";
import { validateColorPalette } from "@/lib/colors/validate-color-palette";
import type {
  ColorPreference,
  GenerationInput,
  GenerationPlatform,
  GenerationQuality,
  GenerationStyle,
  ProfileBackground,
  ProfileIntensity,
  ProfileMode,
} from "@/types/generation";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STYLES = new Set<string>(GENERATION_STYLES.map((item) => item.id));
const COLORS = new Set<string>(GENERATION_COLORS.map((item) => item.id));
const PROFILE_MODE_IDS = new Set(PROFILE_MODES.map((item) => item.id));
const PROFILE_INTENSITY_IDS = new Set(PROFILE_INTENSITIES.map((item) => item.id));
const PROFILE_BACKGROUND_IDS = new Set(PROFILE_BACKGROUNDS.map((item) => item.id));

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
    rawInput.quality === "fast" ? "standard" : rawInput.quality;
  const quality = definition?.quality ?? requestedQuality;

  if (description.length < 10) {
    fields.description = "Describe tu idea con al menos 10 caracteres.";
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
    product?.selectableQuality &&
    definition &&
    !isLegacyVariant &&
    requestedQuality !== undefined &&
    definition.quality !== requestedQuality
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

  let referenceUploadIds: string[] | undefined;
  if (rawInput.referenceUploadIds !== undefined) {
    if (
      !Array.isArray(rawInput.referenceUploadIds) ||
      rawInput.referenceUploadIds.length > 4 ||
      rawInput.referenceUploadIds.some((id) => typeof id !== "string" || !UUID_PATTERN.test(id))
    ) {
      fields.referenceUploadIds = "Puedes usar hasta cuatro imágenes de referencia válidas.";
    } else if (new Set(rawInput.referenceUploadIds).size !== rawInput.referenceUploadIds.length) {
      fields.referenceUploadIds = "No repitas una imagen de referencia.";
    } else if (rawInput.referenceUploadIds.length) {
      referenceUploadIds = rawInput.referenceUploadIds as string[];
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
      ...(primaryText && product?.acceptsText ? { primaryText } : {}),
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
    },
  };
}
