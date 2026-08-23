"use client";

import { useEffect } from "react";

export function ActivityPing({ userId }: { userId: string }) {
  useEffect(() => {
    const key = `crealy:activity:${userId}:${new Date().toISOString().slice(0, 10)}`;
    try {
      if (localStorage.getItem(key) === "1") return;
      localStorage.setItem(key, "1");
    } catch {
      // A blocked localStorage should not prevent the server-side daily upsert.
    }
    void fetch("/api/activity", { method: "POST", keepalive: true });
  }, [userId]);
  return null;
}
