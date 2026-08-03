const allowedDestinations = new Set([
  "/dashboard",
  "/login",
  "/reset-password",
  "/pricing",
]);

const paidPlans = new Set(["starter", "creator", "pro"]);
const billingPeriods = new Set(["monthly", "annual"]);

export function getSafeRedirect(
  candidate: FormDataEntryValue | string | null | undefined,
  fallback: string,
): string {
  if (typeof candidate !== "string") return fallback;

  const value = candidate.trim();
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }

  const destination = new URL(value, "https://crealy.local");
  if (!allowedDestinations.has(destination.pathname)) return fallback;

  if (destination.pathname === "/pricing") {
    const plan = destination.searchParams.get("plan");
    const period = destination.searchParams.get("period");
    if (plan && !paidPlans.has(plan)) return fallback;
    if (period && !billingPeriods.has(period)) return fallback;
    const safe = new URLSearchParams();
    if (plan) safe.set("plan", plan);
    if (period) safe.set("period", period);
    return safe.size ? `/pricing?${safe.toString()}` : "/pricing";
  }

  return destination.pathname;
}
