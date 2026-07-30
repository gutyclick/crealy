export type ToolCategory = "preview" | "analysis" | "download" | "utility";

export type ToolDefinition = {
  id: string;
  name: string;
  description: string;
  href: string;
  category: ToolCategory;
  requiresAuth: boolean;
  usesAI: boolean;
  isEnabled: boolean;
  icon:
    | "image"
    | "panel"
    | "share"
    | "download"
    | "scan"
    | "frame"
    | "sparkles"
    | "compare";
};

export type LocalImage = {
  file: File;
  url: string;
  width: number;
  height: number;
  bytes: number;
  mimeType: string;
};

export type ThumbnailAnalysisCategory = {
  score: number;
  feedback: string;
};

export type ThumbnailAnalysis = {
  overallScore: number;
  summary: string;
  categories: {
    composition: ThumbnailAnalysisCategory;
    textLegibility: ThumbnailAnalysisCategory;
    visualHierarchy: ThumbnailAnalysisCategory;
    contrast: ThumbnailAnalysisCategory;
    smallSizeClarity: ThumbnailAnalysisCategory;
    focus: ThumbnailAnalysisCategory;
  };
  strengths: string[];
  improvements: string[];
  suggestedActions: string[];
};
