export const GENERATION_FEEDBACK_REASONS = [
  { value: "identity", label: "Identidad" },
  { value: "text", label: "Texto" },
  { value: "composition", label: "Composición" },
  { value: "subjects", label: "Sujetos" },
  { value: "style", label: "Estilo" },
  { value: "quality", label: "Calidad" },
] as const;

export type GenerationFeedbackReason =
  (typeof GENERATION_FEEDBACK_REASONS)[number]["value"];
export type GenerationFeedbackVerdict = "useful" | "not_useful";

export type GenerationFeedbackValue = {
  verdict: GenerationFeedbackVerdict;
  reasons: GenerationFeedbackReason[];
  comment: string | null;
  correctionRequested: boolean;
  correctionRequest: string | null;
  updatedAt?: string;
};

