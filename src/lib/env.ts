export function getSupabaseEnv() {
  // NEXT_PUBLIC values must use static property access so Next.js can replace
  // them in the browser bundle. Dynamic process.env[name] access stays empty
  // client-side even when the variable exists in Vercel.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url) {
    throw new Error(
      "[Crealy] Falta NEXT_PUBLIC_SUPABASE_URL. Completa la configuración pública de Supabase.",
    );
  }
  if (!publishableKey) {
    throw new Error(
      "[Crealy] Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Completa la configuración pública de Supabase.",
    );
  }

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
    const e2eLoopbackAllowed =
      process.env.E2E_ALLOW_REMOTE_TEST_PROJECT === "true" &&
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if (
      process.env.NODE_ENV === "production" &&
      url.protocol !== "https:" &&
      !e2eLoopbackAllowed
    ) {
      throw new Error("production requires https");
    }
    return url.origin;
  } catch {
    throw new Error(
      "[Crealy] NEXT_PUBLIC_SITE_URL debe contener un origen HTTP o HTTPS válido.",
    );
  }
}
