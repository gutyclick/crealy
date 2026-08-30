"use client";

import { Gift, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { acknowledgeAnnouncement } from "@/app/(dashboard)/announcement-actions";
import { publishCreditBalance } from "@/lib/credits/client-credit-balance";

export function CreditGiftDialog({ announcementId, creditAmount, availableCredits }: {
  announcementId: string;
  creditAmount: number;
  availableCredits: number | null;
}) {
  const [visible, setVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const acceptRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { acceptRef.current?.focus(); }, []);

  async function dismiss() {
    if (saving) return;
    setSaving(true);
    setError(null);
    const result = await acknowledgeAnnouncement(announcementId).catch(() => ({ ok: false as const }));
    if (!result.ok) {
      setSaving(false);
      setError("No pudimos cerrar el aviso. Inténtalo otra vez.");
      return;
    }
    publishCreditBalance(availableCredits);
    setVisible(false);
  }

  useEffect(() => {
    if (!visible) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") void dismiss();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  if (!visible || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 px-4 py-8">
      <section role="dialog" aria-modal="true" aria-labelledby="credit-gift-title" aria-describedby="credit-gift-description" className="credit-gift-enter relative w-full max-w-md overflow-hidden rounded-2xl border border-brand/25 bg-surface-elevated p-6 shadow-[0_28px_90px_rgba(0,0,0,.65)] sm:p-8">
        <button type="button" aria-label="Cerrar regalo" disabled={saving} onClick={() => void dismiss()} className="absolute right-3 top-3 grid size-11 place-items-center rounded-xl text-muted transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50">
          <X aria-hidden="true" className="size-5" />
        </button>
        <div className="grid size-12 place-items-center rounded-xl bg-brand text-brand-ink shadow-[0_10px_30px_rgba(221,245,39,.14)]">
          <Gift aria-hidden="true" className="size-6" />
        </div>
        <h2 id="credit-gift-title" className="mt-6 max-w-sm text-3xl font-semibold tracking-[-0.035em] text-foreground">Tienes {creditAmount} créditos de regalo</h2>
        <p id="credit-gift-description" className="mt-3 max-w-[38ch] text-sm leading-6 text-muted">Gracias por ser una de las primeras personas en probar Crealy. Te regalamos {creditAmount} créditos más para que sigas explorando y creando.</p>
        <div className="mt-7 flex items-center gap-3 border-y border-white/[0.08] py-4">
          <Sparkles aria-hidden="true" className="size-5 shrink-0 text-brand" />
          <p className="text-sm font-medium text-foreground">Ya están disponibles en tu cuenta.</p>
        </div>
        <button ref={acceptRef} type="button" disabled={saving} onClick={() => void dismiss()} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink transition-colors hover:bg-[var(--brand-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60">
          {saving ? "Guardando…" : "Aceptar y seguir creando"}
        </button>
        {error ? <p role="alert" className="mt-3 text-sm text-red-200">{error}</p> : null}
      </section>
    </div>,
    document.body,
  );
}
