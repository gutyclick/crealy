import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PlatformPreviewFrame({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure className={cn("overflow-hidden rounded-2xl bg-[#171814]", className)}>
      <figcaption className="flex h-11 items-center gap-2 border-b border-white/[0.08] px-4 text-xs font-medium text-white/65">
        <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
        {label}
      </figcaption>
      <div className="p-4 sm:p-5">{children}</div>
    </figure>
  );
}
