"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/create", label: "Crear" },
  { href: "/generations", label: "Creaciones" },
] as const;

export function DashboardNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex items-center gap-1">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center rounded-[0.65rem] px-3 text-sm font-medium transition-colors",
              active
                ? "bg-white/[0.07] text-foreground"
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
