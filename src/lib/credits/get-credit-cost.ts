import "server-only";

import { getCreditServerEnv } from "@/lib/env/server";
import type { GenerationQuality } from "@/types/generation";

/** @deprecated New generations derive cost from the canonical product catalog. */
export function getLegacyGenerationCreditCost(quality: GenerationQuality) {
  const config = getCreditServerEnv();
  return quality === "high"
    ? config.generationHighCost
    : config.generationStandardCost;
}

export function getEditCreditCost() {
  return getCreditServerEnv().editCost;
}
