import { getSafeRedirect } from "@/lib/auth/redirects";

export const OAUTH_RETURN_COOKIE = "crealy_oauth_return";

export type OAuthFlow = "login" | "signup";

export function serializeOAuthReturn(flow: OAuthFlow, destination: string) {
  return `${flow}|${encodeURIComponent(getSafeRedirect(destination, "/dashboard"))}`;
}

export function parseOAuthReturn(value: string | null | undefined) {
  if (!value) return null;
  const separator = value.indexOf("|");
  if (separator < 1) return null;
  const flow = value.slice(0, separator);
  if (flow !== "login" && flow !== "signup") return null;

  try {
    const destination = getSafeRedirect(
      decodeURIComponent(value.slice(separator + 1)),
      flow === "signup" ? "/onboarding" : "/dashboard",
    );
    return { flow, destination } as const;
  } catch {
    return null;
  }
}
