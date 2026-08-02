"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/create", label: "Crear" },
  { href: "/edit", label: "Editar" },
  { href: "/generations", label: "Creaciones" },
  { href: "/dashboard/tools", label: "Herramientas" },
  { href: "/my-style", label: "Mi estilo" },
] as const;

export function DashboardNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="hidden items-center gap-1 lg:flex">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

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
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileDashboardNavigation() {
  const pathname = usePathname();

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
            {item.label}
            {active ? <span className="size-1.5 rounded-full bg-brand-ink" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
