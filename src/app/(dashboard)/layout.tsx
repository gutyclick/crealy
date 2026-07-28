import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const fallbackName = user.email?.split("@")[0] || "Tu cuenta";

  return (
    <div className="min-h-dvh bg-background">
      <DashboardHeader
        displayName={metadataName || fallbackName}
        email={user.email || "Cuenta de Crealy"}
      />
      {children}
    </div>
  );
}
