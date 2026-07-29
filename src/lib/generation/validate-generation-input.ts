import {
  GENERATION_COLORS,
  GENERATION_CONTENT_TYPES,
  GENERATION_FORMATS,
  GENERATION_QUALITIES,
  GENERATION_STYLES,
  getContentTypeConfig,
  requiresHighQuality,
} from "@/config/generation";
import type {
  ColorPreference,
  ContentType,
  GenerationFormat,
  GenerationInput,
  GenerationQuality,
  GenerationStyle,
} from "@/types/generation";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

const CONTENT_TYPES = new Set<ContentType>(
  GENERATION_CONTENT_TYPES.map((item) => item.id),
);
const FORMATS = new Set<GenerationFormat>(
  GENERATION_FORMATS.map((item) => item.id),
);
const STYLES = new Set<GenerationStyle>(
  GENERATION_STYLES.map((item) => item.id),
);
const COLORS = new Set<ColorPreference>(
  GENERATION_COLORS.map((item) => item.id),
);
const QUALITIES = new Set<GenerationQuality>(
  GENERATION_QUALITIES.map((item) => item.id),
);

type ValidationResult =
  | { success: true; data: GenerationInput }
  | { success: false; fields: Record<string, string> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateGenerationInput(rawInput: unknown): ValidationResult {
  if (!isRecord(rawInput)) {
    return {
      success: false,
      fields: { form: "La solicitud no tiene un formato válido." },
    };
  }

  const fields: Record<string, string> = {};
  const description =
    typeof rawInput.description === "string"
      ? rawInput.description.trim()
      : "";
  const primaryText =
    typeof rawInput.primaryText === "string"
      ? rawInput.primaryText.trim()
      : "";
  const contentType = rawInput.contentType;
  const format = rawInput.format;
  const style = rawInput.style;
  const colorPreference = rawInput.colorPreference;
  const quality = rawInput.quality;
  const clientRequestId = rawInput.clientRequestId;
  const projectId = rawInput.projectId;
  const referenceUploadIds = rawInput.referenceUploadIds;

  if (description.length < 10) {
    fields.description = "Describe tu idea con al menos 10 caracteres.";
  } else if (description.length > 1_500) {
    fields.description = "La descripción no puede superar 1.500 caracteres.";
  }

  if (primaryText.length > 120) {
    fields.primaryText = "El texto principal no puede superar 120 caracteres.";
  }

  if (
    typeof contentType !== "string" ||
    !CONTENT_TYPES.has(contentType as ContentType)
  ) {
    fields.contentType = "Elige un tipo de contenido válido.";
  }

  if (typeof format !== "string" || !FORMATS.has(format as GenerationFormat)) {
    fields.format = "Elige un formato válido.";
  }

  if (
    typeof contentType === "string" &&
    CONTENT_TYPES.has(contentType as ContentType) &&
    typeof format === "string" &&
    FORMATS.has(format as GenerationFormat) &&
    !getContentTypeConfig(contentType as ContentType).formats.some(
      (allowedFormat) => allowedFormat === format,
    )
  ) {
    fields.format = "El formato no es compatible con el tipo seleccionado.";
  }

  if (typeof style !== "string" || !STYLES.has(style as GenerationStyle)) {
    fields.style = "Elige un estilo visual válido.";
  }

  if (
    typeof colorPreference !== "string" ||
    !COLORS.has(colorPreference as ColorPreference)
  ) {
    fields.colorPreference = "Elige una preferencia de color válida.";
  }

  if (
    typeof quality !== "string" ||
    !QUALITIES.has(quality as GenerationQuality)
  ) {
    fields.quality = "Elige un nivel de calidad válido.";
  }

  if (
    typeof clientRequestId !== "string" ||
    !UUID_PATTERN.test(clientRequestId)
  ) {
    fields.form = "No pudimos identificar esta solicitud. Inténtalo de nuevo.";
  }

  if (
    projectId !== undefined &&
    (typeof projectId !== "string" || !UUID_PATTERN.test(projectId))
  ) {
    fields.form = "El proyecto seleccionado no es válido.";
  }

  let normalizedReferenceIds: string[] | undefined;
  if (referenceUploadIds !== undefined) {
    if (
      !Array.isArray(referenceUploadIds) ||
      referenceUploadIds.length > 4 ||
      referenceUploadIds.some(
        (id) => typeof id !== "string" || !UUID_PATTERN.test(id),
      )
    ) {
      fields.referenceUploadIds =
        "Puedes usar hasta cuatro imágenes de referencia válidas.";
    } else if (new Set(referenceUploadIds).size !== referenceUploadIds.length) {
      fields.referenceUploadIds = "No repitas una imagen de referencia.";
    } else if (referenceUploadIds.length) {
      normalizedReferenceIds = referenceUploadIds as string[];
    }
  }

  let customColors: string[] | undefined;
  if (colorPreference === "custom") {
    if (
      !Array.isArray(rawInput.customColors) ||
      rawInput.customColors.length < 1 ||
      rawInput.customColors.length > 5
    ) {
      fields.customColors = "Elige entre uno y cinco colores personalizados.";
    } else {
      const normalizedColors = rawInput.customColors.map((color) =>
        typeof color === "string" ? color.trim().toUpperCase() : "",
      );

      if (normalizedColors.some((color) => !HEX_PATTERN.test(color))) {
        fields.customColors = "Usa colores hexadecimales como #DDF527.";
      } else {
        customColors = [...new Set(normalizedColors)];
      }
    }
  }

  if (Object.keys(fields).length > 0) {
    return { success: false, fields };
  }

  return {
    success: true,
    data: {
      clientRequestId: clientRequestId as string,
      ...(typeof projectId === "string" ? { projectId } : {}),
      contentType: contentType as ContentType,
      description,
      ...(primaryText ? { primaryText } : {}),
      style: style as GenerationStyle,
      colorPreference: colorPreference as ColorPreference,
      ...(customColors ? { customColors } : {}),
      format: format as GenerationFormat,
      quality: requiresHighQuality(format as GenerationFormat)
        ? "high"
        : (quality as GenerationQuality),
      ...(normalizedReferenceIds
        ? { referenceUploadIds: normalizedReferenceIds }
        : {}),
    },
  };
}
