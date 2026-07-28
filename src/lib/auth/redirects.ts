const allowedDestinations = new Set([
  "/dashboard",
  "/login",
  "/reset-password",
]);

export function getSafeRedirect(
  candidate: FormDataEntryValue | string | null | undefined,
  fallback: string,
): string {
  if (typeof candidate !== "string") return fallback;

  const value = candidate.trim();
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    !allowedDestinations.has(value)
  ) {
    return fallback;
  }

  return value;
}
