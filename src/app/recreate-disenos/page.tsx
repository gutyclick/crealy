import { SeoProductPage } from "@/components/seo/seo-product-page";
import { seoProductPages } from "@/config/seo-product-pages";
import { createMetadata } from "@/lib/seo/create-metadata";

const page = seoProductPages.recreate;
export const metadata = createMetadata({ title: "Recrear diseños con IA mediante Recreate", description: page.lead, path: `/${page.slug}`, image: page.image });
export default function RecreateDesignsPage() { return <SeoProductPage config={page} />; }
