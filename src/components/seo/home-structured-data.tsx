import { getPublicSiteUrl } from "@/lib/seo/get-public-site-url";

export function HomeStructuredData() {
  const siteUrl = getPublicSiteUrl();
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Crealy",
        inLanguage: "es",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#software`,
        name: "Crealy",
        url: siteUrl,
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        description:
          "Plataforma para diseñar miniaturas, publicaciones y portadas visuales sin necesidad de dominar un editor profesional.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Prueba disponible según la oferta vigente.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
