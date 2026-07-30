import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ToolResultPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl bg-surface p-5 sm:p-7", className)}>
      <div className="mb-5">
        <h2 className="text-xl font-semibold tracking-[-0.025em] text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
