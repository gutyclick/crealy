import { SeoProductPage } from "@/components/seo/seo-product-page";
import { seoProductPages } from "@/config/seo-product-pages";
import { createMetadata } from "@/lib/seo/create-metadata";

const page = seoProductPages.thumbnails;
export const metadata = createMetadata({ title: "Generador de miniaturas para YouTube", description: page.lead, path: `/${page.slug}`, image: page.image });
export default function YoutubeThumbnailGeneratorPage() { return <SeoProductPage config={page} />; }
