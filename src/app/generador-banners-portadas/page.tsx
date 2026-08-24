import { SeoProductPage } from "@/components/seo/seo-product-page";
import { seoProductPages } from "@/config/seo-product-pages";
import { createMetadata } from "@/lib/seo/create-metadata";

const page = seoProductPages.banners;
export const metadata = createMetadata({ title: "Generador de banners y portadas con IA", description: page.lead, path: `/${page.slug}`, image: page.image });
export default function BannerCoverGeneratorPage() { return <SeoProductPage config={page} />; }
