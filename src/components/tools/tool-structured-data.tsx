import { siteConfig } from "@/config/site";
import type { ToolFaqItem } from "@/components/tools/tool-faq";

export function ToolStructuredData({
  name,
  description,
  path,
  faq,
}: {
  name: string;
  description: string;
  path: string;
  faq: readonly ToolFaqItem[];
}) {
  const baseUrl = "https://www.crealy.app";
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name,
      description,
      applicationCategory: "DesignApplication",
      operatingSystem: "Any",
      url: `${baseUrl}${path}`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: siteConfig.name,
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Herramientas",
          item: `${baseUrl}/tools`,
        },
        { "@type": "ListItem", position: 3, name, item: `${baseUrl}${path}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
