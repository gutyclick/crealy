import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

export function createMetadata({
  title,
  description,
  path,
  image = "/opengraph-image",
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  index?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "es_PA",
      siteName: siteConfig.name,
      title,
      description,
      url: path,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: index ? undefined : { index: false, follow: false },
  };
}
