import type { RecreateEvaluation, RecreateEvaluationCriticalError } from "@/types/recreate";

const CORRECTABLE_ERRORS = new Set<RecreateEvaluationCriticalError>([
  "missing_subject",
  "duplicated_subject",
  "identity_drift",
  "incorrect_text",
  "unreadable_text",
]);

export function shouldCorrectRecreate(evaluation: RecreateEvaluation) {
  return evaluation.criticalErrors.some((error) => CORRECTABLE_ERRORS.has(error));
}

export function buildCorrectiveRecreatePrompt(
  originalPrompt: string,
  evaluation: RecreateEvaluation,
) {
  return [
    "REGENERACIÓN CORRECTIVA DE RECREATE.",
    "Genera nuevamente la pieza completa. Mantén la intención y la fórmula aprobadas, pero elimina todos los fallos observados.",
    "",
    originalPrompt,
    "",
    "Fallos visibles que no deben repetirse:",
    ...(evaluation.problems.length
      ? evaluation.problems
      : evaluation.criticalErrors
    ).map((problem) => `- ${problem}`),
    "",
    "Correcciones obligatorias:",
    ...evaluation.corrections.map((correction) => `- ${correction}`),
    "Cada material propio debe aparecer exactamente una vez y mantener su identidad. El texto debe coincidir exactamente con el solicitado o no existir si no se pidió.",
    "Entrega una sola pieza final, sin explicación, mockup ni comparación.",
  ].join("\n");
}
