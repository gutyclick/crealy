export type LaunchStage =
  | "development"
  | "private_beta"
  | "public_beta"
  | "production";

export type LaunchConfig = {
  stage: LaunchStage;
  registrationsEnabled: boolean;
  inviteRequired: boolean;
  billingEnabled: boolean;
  toolsEnabled: boolean;
  onboardingEnabled: boolean;
  supportEnabled: boolean;
};

const launchStages = new Set<LaunchStage>([
  "development",
  "private_beta",
  "public_beta",
  "production",
]);

export function getLaunchStage(): LaunchStage {
  const value = process.env.NEXT_PUBLIC_LAUNCH_STAGE?.trim() as
    | LaunchStage
    | undefined;
  if (value && launchStages.has(value)) return value;
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export function isBetaStage(stage = getLaunchStage()) {
  return stage === "private_beta" || stage === "public_beta";
}
