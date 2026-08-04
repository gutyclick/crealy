"use client";

import {
  Crown,
  Home,
  ImagePlus,
  LayoutGrid,
  MoreHorizontal,
  PencilLine,
  Plus,
  Settings,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { PlanKey } from "@/types/billing";

const primaryItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/recreate", label: "Recreate", icon: Sparkles },
  { href: "/generations", label: "Creaciones", icon: LayoutGrid },
] as const;

const moreItems = [
  {
    href: "/edit",
    label: "Editar una creación",
    detail: "Continúa o recupera una sesión",
    icon: PencilLine,
  },
  {
    href: "/dashboard/tools",
    label: "Herramientas",
    detail: "Previews y utilidades visuales",
    icon: Wrench,
  },
  {
    href: "/my-style",
    label: "Firma visual",
    detail: "Mantén una identidad reconocible",
    icon: ImagePlus,
    premium: true,
  },
  {
    href: "/settings/profile",
    label: "Cuenta y ajustes",
    detail: "Perfil, seguridad y facturación",
    icon: Settings,
  },
] as const;

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileAppNavigation({ plan }: { plan: PlanKey }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isPremiumLocked = plan === "free" || plan === "starter";
  const moreActive =
    moreItems.some((item) => isCurrent(pathname, item.href)) ||
    pathname.startsWith("/settings/");

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = moreButtonRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;
      const focusable = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyboard);
    return () => {
      document.removeEventListener("keydown", handleKeyboard);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-[58] bg-black/64 lg:hidden"
          onPointerDown={(event) => {
            if (!sheetRef.current?.contains(event.target as Node))
              setOpen(false);
          }}
        >
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-surface-elevated px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-24px_70px_rgba(0,0,0,.55)]"
          >
            <div
              aria-hidden="true"
              className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/18"
            />
            <div className="flex min-h-11 items-center justify-between px-2">
              <div>
                <h2
                  id="mobile-more-title"
                  className="text-base font-semibold text-foreground"
                >
                  Más en Crealy
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  Todo lo secundario, sin llenar tu navegación.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="grid size-11 place-items-center rounded-xl text-muted active:bg-white/[0.06]"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <nav aria-label="Más opciones" className="mt-3 grid gap-1 pb-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active =
                  isCurrent(pathname, item.href) ||
                  (item.href === "/settings/profile" &&
                    pathname.startsWith("/settings/"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-16 items-center gap-3 rounded-xl px-3 active:bg-white/[0.06]",
                      active && "bg-white/[0.055]",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-11 shrink-0 place-items-center rounded-xl bg-background text-muted",
                        active && "bg-brand text-brand-ink",
                      )}
                    >
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        {item.label}
                        {"premium" in item &&
                        item.premium &&
                        isPremiumLocked ? (
                          <Crown
                            aria-label="Disponible en Creator y Pro"
                            className="size-3.5 text-brand"
                          />
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {item.detail}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Navegación principal móvil"
        className="fixed inset-x-0 bottom-0 z-[57] border-t border-white/[0.1] bg-background/96 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-end">
          <NavItem item={primaryItems[0]} pathname={pathname} />
          <NavItem item={primaryItems[1]} pathname={pathname} />
          <Link
            href="/create"
            aria-current={isCurrent(pathname, "/create") ? "page" : undefined}
            className="group flex min-h-14 flex-col items-center justify-end gap-1 text-[0.625rem] font-semibold text-foreground"
          >
            <span
              className={cn(
                "grid size-12 place-items-center rounded-2xl bg-brand text-brand-ink shadow-[0_10px_28px_rgba(221,245,39,.16)] transition-transform active:scale-[0.96]",
                isCurrent(pathname, "/create") &&
                  "ring-2 ring-brand ring-offset-2 ring-offset-background",
              )}
            >
              <Plus aria-hidden="true" className="size-6" />
            </span>
            Crear
          </Link>
          <NavItem item={primaryItems[2]} pathname={pathname} />
          <button
            ref={moreButtonRef}
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[0.625rem] font-medium text-muted active:bg-white/[0.05]",
              moreActive && "text-brand",
            )}
          >
            <MoreHorizontal aria-hidden="true" className="size-5" />
            Más
          </button>
        </div>
      </nav>
    </>
  );
}

function NavItem({
  item,
  pathname,
}: {
  item: (typeof primaryItems)[number];
  pathname: string;
}) {
  const Icon = item.icon;
  const active = isCurrent(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[0.625rem] font-medium text-muted active:bg-white/[0.05]",
        active && "text-brand",
      )}
    >
      <Icon aria-hidden="true" className="size-5" />
      {item.label}
    </Link>
  );
}
