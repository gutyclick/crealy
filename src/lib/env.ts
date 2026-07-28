type RequiredPublicVariable =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

function readRequiredVariable(name: RequiredPublicVariable): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `[Crealy] Falta ${name}. Copia .env.example a .env.local y completa la configuración pública de Supabase.`,
    );
  }

  return value;
}

export function getSupabaseEnv() {
  const url = readRequiredVariable("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = readRequiredVariable(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );

  try {
    const parsedUrl = new URL(url);
    const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(
      parsedUrl.hostname,
    );
    if (
      parsedUrl.protocol !== "https:" &&
      !(parsedUrl.protocol === "http:" && isLoopback)
    ) {
      throw new Error("invalid protocol");
    }
  } catch {
    throw new Error(
      "[Crealy] NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida de Supabase.",
    );
  }

  return { url, publishableKey };
}

export function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    if (process.env.NODE_ENV !== "production") {
      return "http://localhost:3000";
    }

    throw new Error(
      "[Crealy] Falta NEXT_PUBLIC_SITE_URL para construir redirecciones seguras.",
    );
  }

  try {
    const url = new URL(configuredUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("invalid protocol");
    }
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      throw new Error("production requires https");
    }
    return url.origin;
  } catch {
    throw new Error(
      "[Crealy] NEXT_PUBLIC_SITE_URL debe contener un origen HTTP o HTTPS válido.",
    );
  }
}
