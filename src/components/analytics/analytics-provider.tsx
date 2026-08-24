"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { trackConversion } from "@/lib/analytics/events";

export function AnalyticsProvider() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname === "/pricing") trackConversion("pricing_viewed");
    if (pathname === "/onboarding") trackConversion("onboarding_started");
    if (pathname.startsWith("/tools/")) {
      trackConversion("tool_opened", { tool: pathname.slice("/tools/".length) });
    }
    const seoLanding = {
      "/generador-miniaturas-youtube": "youtube_thumbnails",
      "/crear-posts-redes-sociales": "social_posts",
      "/generador-banners-portadas": "banners_covers",
      "/recreate-disenos": "recreate",
    }[pathname];
    if (seoLanding) trackConversion("seo_landing_viewed", { landing: seoLanding });
  }, [pathname]);

  return (
    <>
      {process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === "true" && <Analytics />}
      {process.env.NEXT_PUBLIC_SPEED_INSIGHTS_ENABLED === "true" && (
        <SpeedInsights />
      )}
    </>
  );
}
