import "server-only";

const DEFAULT_IMAGE_MODEL = "gpt-image-2";
const DEFAULT_DAILY_LIMIT = 10;
const DEFAULT_COOLDOWN_SECONDS = 15;

function readPositiveInteger(
  name: "GENERATION_DAILY_LIMIT" | "GENERATION_COOLDOWN_SECONDS",
  fallback: number,
) {
  const rawValue = process.env[name]?.trim();
  if (!rawValue) return fallback;

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < 1 || value > 86_400) {
    throw new Error(
      `[Crealy] ${name} debe ser un número entero positivo dentro del rango permitido.`,
    );
  }

  return value;
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
    dailyLimit: readPositiveInteger(
      "GENERATION_DAILY_LIMIT",
      DEFAULT_DAILY_LIMIT,
    ),
    cooldownSeconds: readPositiveInteger(
      "GENERATION_COOLDOWN_SECONDS",
      DEFAULT_COOLDOWN_SECONDS,
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
