const productionSiteUrl = "https://www.crealy.app";

export function getPublicSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return productionSiteUrl;

  try {
    const url = new URL(configured);
    if (!["http:", "https:"].includes(url.protocol)) return productionSiteUrl;
    return url.origin;
  } catch {
    return productionSiteUrl;
  }
}
