"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { PlanKey } from "@/types/billing";

const items = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/create", label: "Crear" },
  { href: "/recreate", label: "Recreate", isNew: true },
  { href: "/generations", label: "Creaciones" },
  { href: "/dashboard/tools", label: "Herramientas" },
  { href: "/my-style", label: "Firma visual", premium: true },
] as const;

function NewBadge({ floating = false }: { floating?: boolean }) {
  return (
    <span
      aria-label="Nueva función"
      className={cn(
        "nav-new-badge -rotate-6 rounded-[0.3rem] bg-brand px-1.5 py-0.5 font-mono text-[0.625rem] font-bold uppercase leading-none tracking-[0.08em] text-brand-ink",
        floating && "absolute -right-1.5 -top-1.5",
      )}
    >
      New
    </span>
  );
}

export function DashboardNavigation({ plan }: { plan: PlanKey }) {
  const pathname = usePathname();
  const showPremiumCue = plan === "free" || plan === "starter";

  return (
    <nav aria-label="Navegación principal" className="hidden items-center gap-1 lg:flex">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-10 items-center rounded-[0.65rem] px-3 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-px after:origin-center after:scale-x-0 after:bg-brand after:transition-transform",
              active
                ? "text-foreground after:scale-x-100"
                : "text-muted hover:bg-white/[0.04] hover:text-foreground",
            )}
          >
            {item.label}
            {"isNew" in item && item.isNew ? <NewBadge floating /> : null}
            {"premium" in item && item.premium && showPremiumCue ? <Crown aria-label="Disponible en Creator y Pro" className="ml-1.5 size-3.5 text-brand" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileDashboardNavigation({ plan }: { plan: PlanKey }) {
  const pathname = usePathname();
  const showPremiumCue = plan === "free" || plan === "starter";

  return (
    <nav aria-label="Navegación móvil" className="grid gap-1 p-2">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center justify-between rounded-[0.7rem] px-3 text-sm font-medium transition-colors",
              active
                ? "bg-brand text-brand-ink"
                : "text-white/75 hover:bg-white/[0.06] hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-2">
              {item.label}
              {"isNew" in item && item.isNew ? <NewBadge /> : null}
              {"premium" in item && item.premium && showPremiumCue ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand"><Crown aria-hidden="true" className="size-3.5" /> Creator · Pro</span> : null}
            </span>
            {active ? <span className="size-1.5 rounded-full bg-brand-ink" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
