"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BadgeDollarSign,
  Images,
  LayoutDashboard,
  MessageSquareText,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/hq", label: "Resumen", icon: LayoutDashboard },
  { href: "/hq/users", label: "Usuarios", icon: Users },
  { href: "/hq/generations", label: "Generaciones", icon: Images },
  { href: "/hq/feedback", label: "Opiniones", icon: MessageSquareText },
  { href: "/hq/jobs", label: "Cola", icon: Activity },
  { href: "/hq/billing", label: "Facturación", icon: BadgeDollarSign },
];

export function HqNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegación de Crealy HQ" className="hq-nav">
      {items.map((item) => {
        const active = item.href === "/hq" ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn("hq-nav-link", active && "hq-nav-link-active")}
          >
            <Icon aria-hidden="true" className="size-[1.1rem]" strokeWidth={1.8} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
