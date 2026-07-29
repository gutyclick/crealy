import "server-only";

export const DEFAULT_RESPONSES_MODEL = "gpt-5.6-luna";
export const EDIT_OUTPUT_MODEL = "gpt-image-2";

export const EDITING_DEFAULTS = {
  maxReferenceImageMb: 10,
  maxReferenceWidth: 8192,
  maxReferenceHeight: 8192,
  maxReferencePixels: 40_000_000,
  dailyLimit: 20,
  cooldownSeconds: 12,
  sessionVersionLimit: 20,
} as const;
