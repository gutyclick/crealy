import type { ThumbnailAnalysis } from "@/types/tools";

export function isThumbnailAnalysis(value: unknown): value is ThumbnailAnalysis {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ThumbnailAnalysis>;
  const categoryValues =
    item.categories && typeof item.categories === "object"
      ? Object.values(item.categories)
      : [];
  return (
    Number.isInteger(item.overallScore) &&
    typeof item.overallScore === "number" &&
    item.overallScore >= 0 &&
    item.overallScore <= 100 &&
    typeof item.summary === "string" &&
    item.summary.length > 0 &&
    categoryValues.length === 6 &&
    categoryValues.every(
      (category) =>
        category &&
        Number.isInteger(category.score) &&
        category.score >= 0 &&
        category.score <= 100 &&
        typeof category.feedback === "string" &&
        category.feedback.length > 0,
    ) &&
    Array.isArray(item.strengths) &&
    item.strengths.every((entry) => typeof entry === "string") &&
    Array.isArray(item.improvements) &&
    item.improvements.every((entry) => typeof entry === "string") &&
    Array.isArray(item.suggestedActions) &&
    item.suggestedActions.every((entry) => typeof entry === "string")
  );
}
