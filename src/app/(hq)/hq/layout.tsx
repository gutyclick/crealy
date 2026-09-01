import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import { HqNavigation } from "@/components/hq/hq-navigation";
import { Logo } from "@/components/ui/logo";
import { requireHqAdmin } from "@/lib/hq/access";

export const metadata: Metadata = {
  title: { default: "Crealy HQ", template: "%s · Crealy HQ" },
  robots: { index: false, follow: false, nocache: true },
};

export default async function HqLayout({ children }: { children: ReactNode }) {
  const user = await requireHqAdmin();
  const displayName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email?.split("@")[0] || "Administrador";

  return (
    <div className="hq-shell min-h-dvh bg-background">
      {/*
      THESIS: Crealy HQ convierte la operación diaria en una mesa de publicación legible y rechaza el dashboard de tarjetas genéricas.
      OWN-WORLD: negro mate, divisiones editoriales, datos compactos y lima reservada para actividad saludable o selección.
      STORY: el operador detecta el pulso, localiza anomalías y abre el registro exacto que necesita revisar.
      FIRST VIEWPORT: navegación persistente a la izquierda, pulso global arriba y tablero operativo continuo a la derecha.
      FORM: Publishing floor, candidato estructural 3, seed f665d52b. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
      */}
      <aside className="hq-sidebar">
        <div className="flex items-center justify-between gap-3">
          <Logo className="[&_img]:h-7" />
          <span className="rounded-md bg-brand px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-brand-ink">HQ</span>
        </div>
        <HqNavigation />
        <div className="mt-auto border-t border-white/8 pt-5">
          <Link href="https://www.crealy.app" className="hq-external-link">
            Abrir Crealy <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
          <form action={signOut} className="mt-2">
            <button type="submit" className="hq-signout">Cerrar sesión</button>
          </form>
        </div>
      </aside>

      <div className="hq-workspace">
        <header className="hq-topbar">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <ShieldCheck aria-hidden="true" className="size-[1.1rem]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              <p className="truncate text-xs text-white/45">Sesión administrativa · AAL2</p>
            </div>
          </div>
          <div className="hq-live"><span aria-hidden="true" /> Producción en vivo</div>
        </header>
        <div className="hq-mobile-nav"><HqNavigation /></div>
        <main className="hq-main">{children}</main>
      </div>
    </div>
  );
}
