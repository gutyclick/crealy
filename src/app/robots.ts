import type { MetadataRoute } from "next";

import { getPublicSiteUrl } from "@/lib/seo/get-public-site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/tools/", "/help", "/contact", "/status"],
      disallow: [
        "/api/",
        "/auth/",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/onboarding",
        "/dashboard",
        "/create",
        "/edit",
        "/generations",
        "/projects",
        "/settings",
        "/billing/",
        "/internal/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
