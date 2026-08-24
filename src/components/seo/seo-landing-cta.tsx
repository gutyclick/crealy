"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { trackConversion } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

export function SeoLandingCta({
  landing,
  href,
  children,
  secondary = false,
  onBrand = false,
}: {
  landing: string;
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
  onBrand?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={() => trackConversion("seo_cta_clicked", { landing, source: "seo_landing" })}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold transition-[background-color,border-color,transform] active:scale-[0.98]",
        onBrand
          ? "border border-black/20 bg-black text-white hover:-translate-y-0.5 hover:bg-black/85"
          : secondary
            ? "border border-white/15 bg-white/[0.035] text-foreground hover:bg-white/[0.07]"
            : "bg-brand text-brand-ink hover:-translate-y-0.5 hover:bg-[var(--brand-hover)]",
      )}
    >
      {children}
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  );
}
