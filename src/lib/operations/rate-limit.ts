import "server-only";

import { createHash } from "node:crypto";

import { getToolsServerEnv } from "@/lib/env/server";
import { getOperationsConfig } from "@/lib/operations/config";
import { createAdminClient } from "@/lib/supabase/admin";

type Policy = {
  limit: number;
  windowSeconds: number;
};

export const RATE_LIMITS = {
  generationUser: { limit: 10, windowSeconds: 60 },
  generationIp: { limit: 20, windowSeconds: 60 },
  editUser: { limit: 15, windowSeconds: 60 },
  editIp: { limit: 30, windowSeconds: 60 },
  uploadUser: { limit: 30, windowSeconds: 60 },
  uploadIp: { limit: 50, windowSeconds: 60 },
  billingUser: { limit: 8, windowSeconds: 60 },
  billingIp: { limit: 15, windowSeconds: 60 },
  authIp: { limit: 12, windowSeconds: 300 },
  toolsPublicIp: { limit: 60, windowSeconds: 60 },
  youtubeDownloaderIp: { limit: 30, windowSeconds: 60 },
  thumbnailAnalysisUser: { limit: 5, windowSeconds: 60 },
  thumbnailAnalysisIp: { limit: 10, windowSeconds: 60 },
  readinessIp: { limit: 10, windowSeconds: 60 },
} satisfies Record<string, Policy>;

export function getToolRateLimits() {
  const config = getToolsServerEnv();
  return {
    publicIp: {
      limit: config.toolsPublicRequestsPerMinute,
      windowSeconds: 60,
    },
    youtubeIp: {
      limit: config.youtubeRequestsPerMinute,
      windowSeconds: 60,
    },
  } satisfies Record<string, Policy>;
}

function clientIp(request: Request) {
  return (
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    "local"
  )
    .split(",")[0]
    .trim();
}

function hashIp(request: Request) {
  return createHash("sha256")
    .update(`${getOperationsConfig().ipHashSalt}:${clientIp(request)}`)
    .digest("hex");
}

async function consume(scopeKey: string, action: string, policy: Policy) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_rate_limit_internal", {
    p_scope_key: scopeKey,
    p_action: action,
    p_limit: policy.limit,
    p_window_seconds: policy.windowSeconds,
  });
  if (error || !data?.[0]) throw new Error("rate_limit_unavailable");
  return data[0];
}

export async function enforceRateLimit({
  request,
  userId,
  action,
  userPolicy,
  ipPolicy,
}: {
  request: Request;
  userId?: string;
  action: string;
  userPolicy?: Policy;
  ipPolicy: Policy;
}) {
  const checks = [
    consume(`ip:${hashIp(request)}`, action, ipPolicy),
    ...(userId && userPolicy
      ? [consume(`user:${userId}`, action, userPolicy)]
      : []),
  ];
  const results = await Promise.all(checks);
  const rejected = results.find((result) => !result.allowed);
  return {
    allowed: !rejected,
    retryAfter: rejected?.retry_after_seconds ?? 0,
    remaining: Math.min(...results.map((result) => result.remaining)),
  };
}
