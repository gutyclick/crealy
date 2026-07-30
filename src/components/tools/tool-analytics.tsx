"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function trackToolEvent(event: "view" | "upload") {
  const path = window.location.pathname;
  if (!path.startsWith("/tools")) return;
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
