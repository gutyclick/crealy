import "server-only";

import { getLaunchStage, type LaunchConfig } from "@/config/launch";
import { getBillingServerEnv } from "@/lib/env/server";

function booleanValue(name: string, fallback: boolean) {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`[Crealy] ${name} debe ser true o false.`);
}

export function getLaunchConfig(): LaunchConfig {
  const stage = getLaunchStage();
  return {
    stage,
    registrationsEnabled: booleanValue("REGISTRATIONS_ENABLED", true),
    inviteRequired: booleanValue(
      "INVITE_REQUIRED",
      stage === "private_beta",
    ),
    billingEnabled: getBillingServerEnv().billingEnabled,
    toolsEnabled: booleanValue("TOOLS_ENABLED", true),
    onboardingEnabled: booleanValue("ONBOARDING_ENABLED", true),
    supportEnabled: booleanValue("SUPPORT_FORM_ENABLED", true),
  };
}
