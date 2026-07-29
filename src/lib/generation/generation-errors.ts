import "server-only";

import OpenAI from "openai";

export type GenerationErrorCode =
  | "provider_auth_error"
  | "provider_rate_limit"
  | "provider_safety_rejection"
  | "provider_timeout"
  | "provider_unavailable"
  | "invalid_provider_response"
  | "storage_upload_failed"
  | "unknown_generation_error";

export class GenerationError extends Error {
  constructor(
    public readonly code: GenerationErrorCode,
    public readonly status: number,
    public readonly userMessage: string,
  ) {
    super(userMessage);
    this.name = "GenerationError";
  }
}

export function mapOpenAIError(error: unknown) {
  if (error instanceof GenerationError) return error;

  if (error instanceof OpenAI.AuthenticationError) {
    return new GenerationError(
      "provider_auth_error",
      503,
      "La generación no está disponible temporalmente.",
    );
  }

  if (error instanceof OpenAI.RateLimitError) {
    return new GenerationError(
      "provider_rate_limit",
      429,
      "El servicio está recibiendo muchas solicitudes. Inténtalo nuevamente en unos minutos.",
    );
  }

  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new GenerationError(
      "provider_timeout",
      503,
      "La generación tardó más de lo esperado. Inténtalo nuevamente.",
    );
  }

  if (error instanceof OpenAI.APIError) {
    if (error.code === "moderation_blocked") {
      return new GenerationError(
        "provider_safety_rejection",
        400,
        "No podemos generar esa solicitud. Prueba describiendo otra idea.",
      );
    }

    if (error.status >= 500) {
      return new GenerationError(
        "provider_unavailable",
        502,
        "No pudimos crear la imagen en este momento.",
      );
    }

    if (error.status === 400 || error.status === 422) {
      return new GenerationError(
        "provider_safety_rejection",
        400,
        "No podemos generar esa solicitud. Prueba describiendo otra idea.",
      );
    }
  }

  return new GenerationError(
    "unknown_generation_error",
    500,
    "No pudimos crear la imagen en este momento.",
  );
}
