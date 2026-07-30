"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackConversion } from "@/lib/analytics/events";

export function trackToolEvent(event: "view" | "upload") {
  const path = window.location.pathname;
  if (!path.startsWith("/tools")) return;
  if (event === "upload") {
    trackConversion("tool_completed", { tool: path.slice("/tools/".length) });
  }
  void fetch("/api/tools/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, path }),
    keepalive: true,
  });
}

export function ToolAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith("/tools")) trackToolEvent("view");
  }, [pathname]);
  return null;
}
