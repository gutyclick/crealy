import { getLaunchStage } from "@/config/launch";

export function getClientEnv() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return {
    siteUrl,
    launchStage: getLaunchStage(),
    analyticsEnabled:
      process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === "true",
    speedInsightsEnabled:
      process.env.NEXT_PUBLIC_SPEED_INSIGHTS_ENABLED === "true",
  };
}

