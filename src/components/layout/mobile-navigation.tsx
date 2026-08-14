"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { siteConfig } from "@/config/site";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;

    firstLinkRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen((current) => !current)}
        className="grid size-11 place-items-center rounded-[0.7rem] border border-white/[0.12] bg-white/[0.025] text-foreground transition-[background-color,transform] duration-200 ease-out hover:bg-white/[0.06] active:scale-[0.97]"
      >
        {open ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Menu aria-hidden="true" className="size-5" />
        )}
      </button>

      <div
        id="mobile-navigation"
        hidden={!open}
        className="absolute inset-x-0 top-full origin-top border-b border-white/[0.08] bg-background/98 px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl"
      >
        <nav aria-label="Navegación móvil" className="grid gap-1">
          {siteConfig.navigation.map((item, index) => (
            <a
              ref={index === 0 ? firstLinkRef : undefined}
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-[0.7rem] px-3 py-3 text-sm font-medium text-white/76 transition-colors hover:bg-white/[0.05] hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <a
            href="/login"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-[0.7rem] px-3 py-3 text-sm font-medium text-muted transition-colors hover:bg-white/[0.05] hover:text-foreground"
          >
            Iniciar sesión
          </a>
        </nav>
      </div>
    </div>
  );
}
