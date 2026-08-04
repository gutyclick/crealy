import Link from "next/link";
import {
  ArrowUpRight,
  Columns2,
  Download,
  Frame,
  ImageIcon,
  PanelTop,
  ScanSearch,
  Share2,
  Sparkles,
} from "lucide-react";

import type { ToolDefinition } from "@/types/tools";

const icons = {
  image: ImageIcon,
  panel: PanelTop,
  share: Share2,
  download: Download,
  scan: ScanSearch,
  frame: Frame,
  sparkles: Sparkles,
  compare: Columns2,
};

export function ToolCard({
  tool,
  href,
}: {
  tool: ToolDefinition;
  href?: string;
}) {
  const Icon = icons[tool.icon];

  return (
    <Link
      href={href ?? tool.href}
      className="group flex min-h-52 min-w-0 max-w-full flex-col justify-between overflow-hidden rounded-2xl bg-surface p-6 shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition-[background-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:bg-surface-elevated hover:shadow-[0_24px_60px_rgba(0,0,0,0.28)] max-sm:w-[calc(100vw-2.5rem)]"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-10 place-items-center rounded-xl bg-brand text-brand-ink">
          <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
        </span>
        <div className="flex items-center gap-2">
          {tool.usesAI && (
            <span className="rounded-full border border-brand/30 px-2.5 py-1 text-xs font-semibold text-brand">
              IA
            </span>
          )}
          <ArrowUpRight
            className="size-5 text-white/35 transition-[color,transform] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand"
            aria-hidden="true"
          />
        </div>
      </div>
      <div>
        <h3 className="break-words text-xl font-semibold tracking-[-0.025em] text-foreground">
          {tool.name}
        </h3>
        <p className="mt-2 break-words text-sm leading-6 text-muted">{tool.description}</p>
      </div>
    </Link>
  );
}
