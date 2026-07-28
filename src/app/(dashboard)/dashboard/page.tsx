import type { Metadata } from "next";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

/*
THESIS: El dashboard orienta la primera acción sin fingir un producto terminado ni llenar el espacio con datos falsos.
OWN-WORLD: mesa oscura, divisiones mate, proporciones de contenido reales y lima reservada para el siguiente paso disponible.
STORY: la persona reconoce su cuenta, entiende qué podrá crear y encuentra un estado inicial honesto.
FIRST VIEWPORT: saludo y acción principal a la izquierda; formatos compactos y estado del producto a la derecha.
FORM: superficie Operate contenida, sin sidebar prematura, con barra superior y contenido adaptable.
*/

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error && process.env.NODE_ENV === "development") {
    console.error(`[Crealy Dashboard · perfil] ${error.message}`);
  }

  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const localEmailName = user.email?.split("@")[0] || "";
  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ||
    metadataName.split(/\s+/)[0] ||
    localEmailName;

  return <DashboardHome firstName={firstName || undefined} />;
}
