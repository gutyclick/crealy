import "server-only";

import {
  DEFAULT_RESPONSES_MODEL,
  EDITING_DEFAULTS,
} from "@/config/openai";

const DEFAULT_IMAGE_MODEL = "gpt-image-2";
const DEFAULT_DAILY_LIMIT = 10;
const DEFAULT_COOLDOWN_SECONDS = 15;

function readPositiveInteger(
  name: string,
  fallback: number,
  maximum = 100_000_000,
) {
  const rawValue = process.env[name]?.trim();
  if (!rawValue) return fallback;

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new Error(
      `[Crealy] ${name} debe ser un número entero positivo dentro del rango permitido.`,
    );
  }

  return value;
}

function readNonNegativeInteger(
  name: string,
  fallback: number,
  maximum = 100_000_000,
) {
  const rawValue = process.env[name]?.trim();
  if (!rawValue) return fallback;

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
    throw new Error(
      `[Crealy] ${name} debe ser un número entero no negativo dentro del rango permitido.`,
    );
  }
  return value;
}

function readBoolean(name: string, fallback: boolean) {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`[Crealy] ${name} debe ser true o false.`);
}

function readGenerationEnabled() {
  const rawValue = process.env.OPENAI_GENERATION_ENABLED?.trim().toLowerCase();

  if (!rawValue) return true;
  if (rawValue === "true") return true;
  if (rawValue === "false") return false;

  throw new Error(
    "[Crealy] OPENAI_GENERATION_ENABLED debe ser true o false.",
  );
}

export function getGenerationServerEnv() {
  const generationEnabled = readGenerationEnabled();
  const apiKey = process.env.OPENAI_API_KEY?.trim() || "";
  const imageModel =
    process.env.OPENAI_IMAGE_MODEL?.trim() || DEFAULT_IMAGE_MODEL;

  if (generationEnabled && !apiKey) {
    throw new Error(
      "[Crealy] Falta OPENAI_API_KEY. Configura una clave de OpenAI Platform únicamente en el servidor.",
    );
  }

  return {
    apiKey,
    imageModel,
    generationEnabled,
    fourKEnabled: readBoolean("FOUR_K_GENERATION_ENABLED", false),
    dailyLimit: readPositiveInteger(
      "GENERATION_DAILY_LIMIT",
      DEFAULT_DAILY_LIMIT,
      86_400,
    ),
    cooldownSeconds: readPositiveInteger(
      "GENERATION_COOLDOWN_SECONDS",
      DEFAULT_COOLDOWN_SECONDS,
      86_400,
    ),
  };
}

export function isGenerationAvailable() {
  try {
    const config = getGenerationServerEnv();
    return config.generationEnabled && Boolean(config.apiKey);
  } catch {
    return false;
  }
}

export function getEditingServerEnv() {
  const editingEnabled = readBoolean("OPENAI_EDITING_ENABLED", true);
  const apiKey = process.env.OPENAI_API_KEY?.trim() || "";
  const responsesModel =
    process.env.OPENAI_RESPONSES_MODEL?.trim() || DEFAULT_RESPONSES_MODEL;

  if (editingEnabled && !apiKey) {
    throw new Error(
      "[Crealy] Falta OPENAI_API_KEY para habilitar la edición.",
    );
  }

  return {
    apiKey,
    editingEnabled,
    responsesModel,
    maxReferenceImageBytes:
      readPositiveInteger(
        "REFERENCE_IMAGE_MAX_MB",
        EDITING_DEFAULTS.maxReferenceImageMb,
        20,
      ) *
      1024 *
      1024,
    maxReferenceWidth: readPositiveInteger(
      "REFERENCE_IMAGE_MAX_WIDTH",
      EDITING_DEFAULTS.maxReferenceWidth,
      16_384,
    ),
    maxReferenceHeight: readPositiveInteger(
      "REFERENCE_IMAGE_MAX_HEIGHT",
      EDITING_DEFAULTS.maxReferenceHeight,
      16_384,
    ),
    maxReferencePixels: readPositiveInteger(
      "REFERENCE_IMAGE_MAX_PIXELS",
      EDITING_DEFAULTS.maxReferencePixels,
      100_000_000,
    ),
    dailyLimit: readPositiveInteger(
      "EDIT_DAILY_LIMIT",
      EDITING_DEFAULTS.dailyLimit,
      10_000,
    ),
    cooldownSeconds: readPositiveInteger(
      "EDIT_COOLDOWN_SECONDS",
      EDITING_DEFAULTS.cooldownSeconds,
      86_400,
    ),
    sessionVersionLimit: readPositiveInteger(
      "EDIT_SESSION_VERSION_LIMIT",
      EDITING_DEFAULTS.sessionVersionLimit,
      100,
    ),
  };
}

export function isEditingAvailable() {
  try {
    const config = getEditingServerEnv();
    return config.editingEnabled && Boolean(config.apiKey);
  } catch {
    return false;
  }
}

export function getCreditServerEnv() {
  return {
    freeSignupCredits: readNonNegativeInteger("FREE_SIGNUP_CREDITS", 5, 10_000),
    proMonthlyCredits: readPositiveInteger(
      "PRO_MONTHLY_CREDITS",
      100,
      1_000_000,
    ),
    businessMonthlyCredits: readPositiveInteger(
      "BUSINESS_MONTHLY_CREDITS",
      500,
      1_000_000,
    ),
    generationStandardCost: readPositiveInteger(
      "CREDITS_COST_GENERATION_STANDARD",
      1,
      10_000,
    ),
    generationHighCost: readPositiveInteger(
      "CREDITS_COST_GENERATION_HIGH",
      2,
      10_000,
    ),
    editCost: readPositiveInteger("CREDITS_COST_EDIT", 1, 10_000),
  };
}

export function getBillingServerEnv() {
  return {
    billingEnabled: readBoolean("STRIPE_BILLING_ENABLED", false),
    businessPlanEnabled: readBoolean("BUSINESS_PLAN_ENABLED", false),
    gracePeriodDays: readNonNegativeInteger(
      "BILLING_GRACE_PERIOD_DAYS",
      3,
      30,
    ),
    proPriceId: process.env.STRIPE_PRO_PRICE_ID?.trim() || "",
    businessPriceId: process.env.STRIPE_BUSINESS_PRICE_ID?.trim() || "",
    businessPriceDisplay:
      process.env.STRIPE_BUSINESS_PRICE_DISPLAY?.trim() || "",
    proPriceDisplay: process.env.STRIPE_PRO_PRICE_DISPLAY?.trim() || "",
  };
}

export function isCheckoutAvailable() {
  try {
    const config = getBillingServerEnv();
    return Boolean(
      config.billingEnabled &&
        config.proPriceId &&
        config.proPriceDisplay &&
        process.env.STRIPE_SECRET_KEY?.trim(),
    );
  } catch {
    return false;
  }
}
