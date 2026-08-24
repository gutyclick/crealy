import { SeoProductPage } from "@/components/seo/seo-product-page";
import { seoProductPages } from "@/config/seo-product-pages";
import { createMetadata } from "@/lib/seo/create-metadata";

const page = seoProductPages.posts;
export const metadata = createMetadata({ title: "Crear posts para redes sociales con IA", description: page.lead, path: `/${page.slug}`, image: page.image });
export default function SocialPostCreatorPage() { return <SeoProductPage config={page} />; }
