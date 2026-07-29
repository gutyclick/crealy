import "server-only";

import { getCreditServerEnv } from "@/lib/env/server";
import type { GenerationQuality } from "@/types/generation";

export function getGenerationCreditCost(quality: GenerationQuality) {
  const config = getCreditServerEnv();
  return quality === "high"
    ? config.generationHighCost
    : config.generationStandardCost;
}

export function getEditCreditCost() {
  return getCreditServerEnv().editCost;
}
