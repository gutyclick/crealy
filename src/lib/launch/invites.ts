import "server-only";

import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

export function hashInviteCode(code: string) {
  return createHash("sha256").update(code.trim()).digest("hex");
}

export async function claimBetaInvite(code: string, email: string) {
  if (code.trim().length < 12 || code.trim().length > 160) return false;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_beta_invite_internal", {
    p_code_hash: hashInviteCode(code),
    p_email: email,
  });
  return !error && data === true;
}

export async function validateBetaInvite(code: string, email: string) {
  if (code.trim().length < 12 || code.trim().length > 160) return false;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("validate_beta_invite_internal", {
    p_code_hash: hashInviteCode(code),
    p_email: email,
  });
  return !error && data === true;
}
