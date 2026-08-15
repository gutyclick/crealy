"use client";

import {
  Bell,
  ChevronDown,
  Coins,
  CreditCard,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { signOut } from "@/app/(auth)/actions";
import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import {
  CreationNotificationCenter,
  type CreationNotification,
} from "@/components/dashboard/creation-notification-center";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/ui/logo";
import {
  CREDIT_BALANCE_REFRESH_EVENT,
  publishCreditBalance,
  useCreditBalance,
} from "@/lib/credits/client-credit-balance";
import type { PlanKey } from "@/types/billing";

type DashboardHeaderProps = {
  displayName: string;
  email: string;
  credits: number | null;
  initialNotifications: CreationNotification[];
  plan: PlanKey;
};

const accountItems = [
  { href: "/settings/profile", label: "Perfil", icon: UserRound },
  { href: "/settings/security", label: "Seguridad", icon: ShieldCheck },
  { href: "/settings/billing", label: "Plan y facturación", icon: CreditCard },
  { href: "/settings/notifications", label: "Notificaciones", icon: Bell },
  { href: "/settings/account", label: "Datos de la cuenta", icon: Settings },
] as const;

export function DashboardHeader({
  displayName,
  email,
  credits,
  initialNotifications,
  plan,
}: DashboardHeaderProps) {
  const initial = displayName.charAt(0).toUpperCase() || "C";
  const [openMenu, setOpenMenu] = useState<"account" | null>(null);
  const currentCredits = useCreditBalance(credits);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const firstAccountLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!openMenu) return;

    firstAccountLinkRef.current?.focus();

    function closeOnOutsideClick(event: PointerEvent) {
      const target = event.target as Node;
      if (!accountMenuRef.current?.contains(target)) {
        setOpenMenu(null);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpenMenu(null);
      accountButtonRef.current?.focus();
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openMenu]);

  useEffect(() => {
    let active = true;
    let requestSequence = 0;

    async function reconcileCredits() {
      const sequence = ++requestSequence;
      try {
        const response = await fetch("/api/billing/status", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { credits?: unknown };
        if (
          active &&
          sequence === requestSequence &&
          typeof payload.credits === "number"
        ) {
          publishCreditBalance(payload.credits);
        }
      } catch {
        // Keep the last known balance until the next automatic reconciliation.
      }
    }

    function refreshBalance() {
      void reconcileCredits();
    }

    window.addEventListener(CREDIT_BALANCE_REFRESH_EVENT, refreshBalance);
    window.addEventListener("focus", refreshBalance);
    return () => {
      active = false;
      window.removeEventListener(CREDIT_BALANCE_REFRESH_EVENT, refreshBalance);
      window.removeEventListener("focus", refreshBalance);
    };
  }, []);

  const closeMenus = () => setOpenMenu(null);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-background/92 backdrop-blur-xl">
      <Container className="grid min-h-[4.5rem] grid-cols-[1fr_auto] items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
        <Logo className="justify-self-start" />

        <div className="justify-self-center">
          <DashboardNavigation plan={plan} />
        </div>

        <div className="flex items-center gap-1.5 justify-self-end">
          <CreationNotificationCenter
            initialNotifications={initialNotifications}
          />

          <div ref={accountMenuRef} className="relative">
            <button
              ref={accountButtonRef}
              type="button"
              aria-label="Abrir menú de usuario"
              aria-expanded={openMenu === "account"}
              aria-controls="dashboard-account-menu"
              onClick={() =>
                setOpenMenu((current) =>
                  current === "account" ? null : "account",
                )
              }
              className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-[0.7rem] px-1.5 py-1 transition-colors hover:bg-white/[0.05] sm:gap-3 sm:px-2"
            >
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-[0.65rem] bg-surface-elevated text-sm font-semibold text-brand"
              >
                {initial}
              </span>
              <span className="hidden max-w-36 text-left md:block">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {displayName}
                </span>
                <span className="block truncate text-xs text-muted">
                  {currentCredits === null
                    ? "Saldo no disponible"
                    : `${currentCredits} créditos`}
                </span>
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`size-4 text-muted transition-transform ${openMenu === "account" ? "rotate-180" : ""}`}
              />
            </button>

            {openMenu === "account" ? (
              <div
                id="dashboard-account-menu"
                className="absolute right-0 top-[calc(100%+0.65rem)] z-20 w-[min(19rem,calc(100vw-2rem))] rounded-[0.8rem] border border-white/10 bg-surface-elevated p-2 shadow-[0_18px_50px_rgba(0,0,0,0.42)]"
              >
                <div className="border-b border-white/[0.08] px-3 pb-3 pt-2">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">{email}</p>
                </div>

                <Link
                  ref={firstAccountLinkRef}
                  href="/settings/billing"
                  onClick={closeMenus}
                  className="my-2 flex min-h-12 items-center justify-between rounded-[0.7rem] bg-white/[0.045] px-3 transition-colors hover:bg-white/[0.075]"
                >
                  <span className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                    <Coins aria-hidden="true" className="size-4 text-brand" />
                    Créditos disponibles
                  </span>
                  <strong className="text-sm text-brand">
                    {currentCredits ?? "—"}
                  </strong>
                </Link>

                <p className="px-3 pb-1.5 pt-1 text-xs font-medium text-muted">
                  Configuración
                </p>
                {accountItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenus}
                      className="flex min-h-11 w-full items-center gap-3 rounded-[0.65rem] px-3 text-sm font-medium text-white/72 transition-colors hover:bg-white/[0.05] hover:text-foreground"
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}

                <form
                  action={signOut}
                  className="mt-2 border-t border-white/[0.08] pt-2"
                >
                  <SignOutButton />
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </header>
  );
}
