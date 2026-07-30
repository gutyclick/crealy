import "server-only";

import { getGenerationServerEnv } from "@/lib/env/server";

export type ImageProviderReadinessCode =
  | "ready"
  | "provider_auth_error"
  | "provider_model_unavailable"
  | "provider_rate_limit"
  | "provider_timeout"
  | "provider_unavailable"
  | "generation_disabled";

export type ImageProviderReadiness = {
  ok: boolean;
  code: ImageProviderReadinessCode;
  model: string;
};

const SUCCESS_TTL_MS = 5 * 60 * 1000;
const FAILURE_TTL_MS = 30 * 1000;

let cached:
  | {
      expiresAt: number;
      result: ImageProviderReadiness;
    }
  | undefined;

function result(
  ok: boolean,
  code: ImageProviderReadinessCode,
  model: string,
): ImageProviderReadiness {
  return { ok, code, model };
}

export async function checkImageProvider({
  force = false,
}: {
  force?: boolean;
} = {}): Promise<ImageProviderReadiness> {
  const now = Date.now();
  if (!force && cached && cached.expiresAt > now) return cached.result;

  let apiKey: string;
  let imageModel: string;
  let generationEnabled: boolean;
  try {
    ({ apiKey, imageModel, generationEnabled } = getGenerationServerEnv());
  } catch {
    return result(false, "provider_auth_error", "unknown");
  }

  if (!generationEnabled) {
    return result(false, "generation_disabled", imageModel);
  }

  let readiness: ImageProviderReadiness;
  try {
    const response = await fetch(
      `https://api.openai.com/v1/models/${encodeURIComponent(imageModel)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      },
    );

    if (response.ok) {
      readiness = result(true, "ready", imageModel);
    } else if (response.status === 401 || response.status === 403) {
      readiness = result(false, "provider_auth_error", imageModel);
    } else if (response.status === 404) {
      readiness = result(false, "provider_model_unavailable", imageModel);
    } else if (response.status === 429) {
      readiness = result(false, "provider_rate_limit", imageModel);
    } else {
      readiness = result(false, "provider_unavailable", imageModel);
    }
  } catch (error) {
    readiness = result(
      false,
      error instanceof Error && error.name === "TimeoutError"
        ? "provider_timeout"
        : "provider_unavailable",
      imageModel,
    );
  }

  cached = {
    result: readiness,
    expiresAt:
      now + (readiness.ok ? SUCCESS_TTL_MS : FAILURE_TTL_MS),
  };
  return readiness;
}
