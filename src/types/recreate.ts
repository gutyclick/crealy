import type { ContentType } from "@/types/generation";

export type RecreateSimilarity = "inspired" | "similar" | "very_similar";
export type RecreateFocus = "composition" | "subject" | "text" | "atmosphere";
export type RecreateGoal = "performance" | "clean" | "premium" | "bold";
export type RecreateCategory = Extract<ContentType, "thumbnail" | "social-post" | "banner" | "social-cover">;
export type RecreateReferenceRole =
  | "protagonist"
  | "product"
  | "background"
  | "supporting";
export type RecreatePreservationKey =
  | "composition"
  | "pose"
  | "lighting"
  | "colors"
  | "typography";
export type RecreatePreservation = Record<RecreatePreservationKey, boolean>;

export type RecreateBlueprint = {
  category: RecreateCategory;
  composition: string;
  hierarchy: string;
  visualStyle: string;
  background: string;
  emotion: string;
  textDensity: string;
  subjectScale: string;
  colorPalette: string[];
  focalElements: string[];
  replaceableElements: string[];
};

export type RecreateEvaluationCriticalError =
  | "missing_subject"
  | "duplicated_subject"
  | "identity_drift"
  | "incorrect_text"
  | "unreadable_text"
  | "composition_mismatch"
  | "wrong_format"
  | "incomplete_image"
  | "watermark";

export type RecreateEvaluation = {
  approved: boolean;
  score: number;
  identityScore: number;
  compositionScore: number;
  textScore: number;
  criticalErrors: RecreateEvaluationCriticalError[];
  problems: string[];
  corrections: string[];
};
