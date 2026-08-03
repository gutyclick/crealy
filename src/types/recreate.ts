import type { ContentType } from "@/types/generation";

export type RecreateSimilarity = "inspired" | "similar" | "very_similar";
export type RecreateCategory = Extract<ContentType, "thumbnail" | "social-post" | "banner" | "social-cover">;

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

