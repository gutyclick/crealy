import "server-only";

import type { PlanKey } from "@/types/billing";

const DEFAULT_STORAGE_MB = { free: 250, starter: 512, creator: 2048, pro: 5120 } as const;

function configuredMb(name: string, fallback: number) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isSafeInteger(value) || value < 1 || value > 1_000_000) {
    throw new Error(`[Crealy] ${name} tiene un valor inválido.`);
  }
  return value;
}

export function getStorageQuotaMb(plan: PlanKey) {
  if (plan === "business") return configuredMb("PRO_STORAGE_LIMIT_MB", DEFAULT_STORAGE_MB.pro);
  if (plan === "pro") return configuredMb("CREATOR_STORAGE_LIMIT_MB", DEFAULT_STORAGE_MB.creator);
  if (plan === "starter") return configuredMb("STARTER_STORAGE_LIMIT_MB", DEFAULT_STORAGE_MB.starter);
  return configuredMb("FREE_STORAGE_LIMIT_MB", DEFAULT_STORAGE_MB.free);
}

export function getStorageQuotaBytes(plan: PlanKey) {
  return getStorageQuotaMb(plan) * 1024 * 1024;
}
