import type { ContentType } from "@/types/generation";

export type StyleConsistency = "flexible" | "balanced" | "strict";

export type StyleVisualAttributes = {
  colors: string[];
  composition: string[];
  typography: string[];
  lighting: string[];
  subjects: string[];
  effects: string[];
  mood: string[];
};

export type StyleAnalysis = {
  summary: string;
  attributes: StyleVisualAttributes;
  consistencyScore: number;
  warnings: string[];
};

export type BrandStyleReference = {
  id: string;
  styleId: string;
  imageUrl: string | null;
  position: number;
  width: number | null;
  height: number | null;
  createdAt: string;
};

export type BrandStyle = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  visualSummary: string | null;
  visualAttributes: StyleVisualAttributes | null;
  consistencyScore: number | null;
  warnings: string[];
  referenceImages: BrandStyleReference[];
  supportedDesignTypes: ContentType[];
  analysisStatus: "pending" | "analyzing" | "ready" | "failed";
  createdAt: string;
  updatedAt: string;
};
