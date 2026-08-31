import {
  GENERATION_FEEDBACK_REASONS,
  type GenerationFeedbackReason,
  type GenerationFeedbackValue,
  type GenerationFeedbackVerdict,
} from "@/types/generation-feedback";

const allowedReasons = new Set<GenerationFeedbackReason>(
  GENERATION_FEEDBACK_REASONS.map(({ value }) => value),
);

function optionalText(value: unknown, maximum: number) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (!normalized || normalized.length > maximum || /[<>]/.test(normalized)) {
    return undefined;
  }
  return normalized;
}

export function parseGenerationFeedbackInput(
  raw: unknown,
): GenerationFeedbackValue | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const input = raw as Record<string, unknown>;
  const verdict = input.verdict;
  if (verdict !== "useful" && verdict !== "not_useful") return null;

  if (!Array.isArray(input.reasons) || input.reasons.length > 6) return null;
  const reasons = [...new Set(input.reasons)];
  if (
    reasons.some(
      (reason): reason is Exclude<typeof reason, GenerationFeedbackReason> =>
        typeof reason !== "string" ||
        !allowedReasons.has(reason as GenerationFeedbackReason),
    )
  ) {
    return null;
  }

  const comment = optionalText(input.comment, 1000);
  if (comment === undefined) return null;

  return {
    verdict: verdict as GenerationFeedbackVerdict,
    reasons: reasons as GenerationFeedbackReason[],
    comment,
    correctionRequested: false,
    correctionRequest: null,
  };
}

export function pickAutomaticEvaluation(
  metadata: Record<string, unknown>,
) {
  const keys = [
    "evaluationScore",
    "criticalErrors",
    "evaluationProblems",
    "wasAutomaticallyRegenerated",
    "shownResult",
    "recreateEvaluationScore",
    "recreateIdentityScore",
    "recreateCompositionScore",
    "recreateTextScore",
    "recreateCriticalErrors",
    "recreateEvaluationProblems",
    "wasRecreateAutomaticallyRegenerated",
    "recreateShownResult",
  ] as const;

  return Object.fromEntries(
    keys
      .filter((key) => metadata[key] !== undefined)
      .map((key) => [key, metadata[key]]),
  );
}
