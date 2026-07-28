import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/[0.12] bg-background/70 px-3 py-1.5 text-xs font-medium text-white/78 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}
