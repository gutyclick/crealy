import type { MetadataRoute } from "next";

import { tools } from "@/config/tools";
import { getPublicSiteUrl } from "@/lib/seo/get-public-site-url";

// Evaluated when Next builds the static sitemap. This keeps lastmod aligned
// with the deployment that actually published the current page content.
const lastModified = new Date(
  process.env.SITE_LAST_MODIFIED ?? process.env.VERCEL_BUILD_TIME ?? Date.now(),
);

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getPublicSiteUrl();
  const routes: Array<{
    path: string;
    changeFrequency: "weekly" | "monthly";
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
    { path: "/tools", changeFrequency: "weekly", priority: 0.9 },
    { path: "/help", changeFrequency: "monthly", priority: 0.6 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
    { path: "/status", changeFrequency: "weekly", priority: 0.4 },
    { path: "/generador-miniaturas-youtube", changeFrequency: "weekly", priority: 0.9 },
    { path: "/crear-posts-redes-sociales", changeFrequency: "weekly", priority: 0.9 },
    { path: "/generador-banners-portadas", changeFrequency: "weekly", priority: 0.9 },
    { path: "/recreate-disenos", changeFrequency: "weekly", priority: 0.9 },
  ];
  if (process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === "true") {
    routes.push(
      { path: "/privacy", changeFrequency: "monthly", priority: 0.3 },
      { path: "/terms", changeFrequency: "monthly", priority: 0.3 },
      { path: "/cookies", changeFrequency: "monthly", priority: 0.3 },
      { path: "/acceptable-use", changeFrequency: "monthly", priority: 0.3 },
      { path: "/refund-policy", changeFrequency: "monthly", priority: 0.3 },
    );
  }
  for (const tool of tools) {
    if (tool.isEnabled) {
      routes.push({
        path: tool.href,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }
  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
