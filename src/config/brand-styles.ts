import type { PlanKey } from "@/types/billing";
import type { ContentType } from "@/types/generation";

export type BrandStyleEntitlement = {
  enabled: boolean;
  tierLabel: "Free" | "Creator" | "Pro";
  maxStyles: number;
  minReferences: number;
  maxReferences: number;
  supportedDesignTypes: ContentType[];
  canDuplicate: boolean;
};

export const BRAND_STYLE_MAX_FILE_BYTES = 8 * 1024 * 1024;
export const BRAND_STYLE_NAME_MAX_LENGTH = 80;

export const BRAND_STYLE_ENTITLEMENTS: Record<PlanKey, BrandStyleEntitlement> = {
  free: { enabled: false, tierLabel: "Free", maxStyles: 0, minReferences: 3, maxReferences: 0, supportedDesignTypes: [], canDuplicate: false },
  pro: { enabled: true, tierLabel: "Creator", maxStyles: 1, minReferences: 3, maxReferences: 6, supportedDesignTypes: ["thumbnail"], canDuplicate: false },
  business: { enabled: true, tierLabel: "Pro", maxStyles: 5, minReferences: 3, maxReferences: 10, supportedDesignTypes: ["thumbnail", "banner", "social-post", "social-cover"], canDuplicate: true },
};

export function getBrandStyleEntitlement(plan: PlanKey) {
  return BRAND_STYLE_ENTITLEMENTS[plan];
}
