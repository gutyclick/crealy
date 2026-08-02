import type { Metadata } from "next";

import { BrandStyleStudio } from "@/components/brand-styles/brand-style-studio";
import { Container } from "@/components/layout/container";
import { getBrandStyleAccess, listBrandStyles } from "@/lib/brand-styles/service";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Firma visual", description: "Haz reconocible tu identidad visual en cada creación de Crealy." };

export default async function MyStylePage() {
  const user = await requireUser();
  const access = await getBrandStyleAccess(user.id);
  const styles = access.entitlement.enabled ? await listBrandStyles(user.id) : [];
  return <main className="py-7 sm:py-10"><Container><BrandStyleStudio initialStyles={styles} plan={access.plan} entitlement={access.entitlement} /></Container></main>;
}
