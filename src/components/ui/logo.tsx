import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 text-[1.08rem] font-semibold tracking-[-0.025em] text-foreground",
        className,
      )}
      aria-label="Crealy, página principal"
    >
      <span
        aria-hidden="true"
        className="relative grid size-7 place-items-center rounded-[0.55rem] bg-brand text-brand-ink"
      >
        <span className="size-2.5 rotate-45 rounded-[0.12rem] border-2 border-current" />
      </span>
      <span>
        Crealy<span className="text-brand">.</span>
      </span>
    </Link>
  );
}
