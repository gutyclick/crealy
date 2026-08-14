import type { Metadata } from "next";

import { BillingSuccessStatus } from "@/components/billing/billing-success-status";
import { Logo } from "@/components/ui/logo";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title: "Confirmando tu plan | Crealy",
  robots: { index: false, follow: false },
};

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  await requireUser("/billing/success");
  const { session_id: sessionId } = await searchParams;

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="absolute left-5 top-5 sm:left-8 sm:top-8">
        <Logo />
      </div>
      <BillingSuccessStatus sessionId={sessionId} />
    </main>
  );
}
