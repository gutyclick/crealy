import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";

const tabs = [
  { href: "/settings/profile", label: "Perfil" },
  { href: "/settings/security", label: "Seguridad" },
  { href: "/settings/billing", label: "Facturación" },
  { href: "/settings/storage", label: "Almacenamiento" },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="border-b border-white/[0.08]">
        <Container>
          <nav
            aria-label="Configuración de cuenta"
            className="flex gap-1 overflow-x-auto py-2"
          >
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-white/[0.05] hover:text-foreground"
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
      {children}
    </>
  );
}
