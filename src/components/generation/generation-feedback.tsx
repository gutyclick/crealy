"use client";

import {
  Check,
  LoaderCircle,
  MessageSquareText,
  ThumbsDown,
  ThumbsUp,
  Wrench,
} from "lucide-react";
import { useRef, useState } from "react";

import {
  GENERATION_FEEDBACK_REASONS,
  type GenerationFeedbackReason,
  type GenerationFeedbackValue,
  type GenerationFeedbackVerdict,
} from "@/types/generation-feedback";

type SaveState = "idle" | "saving" | "saved" | "error";

const emptyFeedback: GenerationFeedbackValue = {
  verdict: "useful",
  reasons: [],
  comment: null,
  correctionRequested: false,
  correctionRequest: null,
};

export function GenerationFeedback({
  generationId,
  initialFeedback,
}: {
  generationId: string;
  initialFeedback: GenerationFeedbackValue | null;
}) {
  const [feedback, setFeedback] = useState<GenerationFeedbackValue>(
    initialFeedback ?? emptyFeedback,
  );
  const [hasVerdict, setHasVerdict] = useState(Boolean(initialFeedback));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const editRevision = useRef(0);

  async function save(next: GenerationFeedbackValue, quick = false) {
    const submittedRevision = editRevision.current;
    setSaveState("saving");
    setMessage(null);
    const response = await fetch(`/api/generations/${generationId}/feedback`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => null);
    const payload = response
      ? await response.json().catch(() => null) as {
          error?: string;
          feedback?: GenerationFeedbackValue;
        } | null
      : null;

    if (!response?.ok || !payload?.feedback) {
      setSaveState("error");
      setMessage(payload?.error ?? "No pudimos guardar tu opinión. Inténtalo otra vez.");
      return false;
    }

    if (editRevision.current !== submittedRevision) {
      setSaveState("idle");
      setMessage(
        quick
          ? "Valoración guardada. Tienes detalles sin guardar."
          : "Cambiaste un detalle durante el envío. Guárdalo de nuevo.",
      );
      return true;
    }

    setFeedback(payload.feedback);
    setHasVerdict(true);
    setSaveState("saved");
    setMessage(
      quick
        ? "Opinión guardada. Puedes añadir detalles si quieres."
        : payload.feedback.correctionRequested
          ? "Opinión guardada y corrección solicitada."
          : "Gracias. Tu opinión quedó ligada a este resultado.",
    );
    return true;
  }

  function chooseVerdict(verdict: GenerationFeedbackVerdict) {
    if (saveState === "saving") return;
    const next = {
      ...feedback,
      verdict,
      ...(verdict === "useful"
        ? { correctionRequested: false, correctionRequest: null }
        : {}),
    };
    editRevision.current += 1;
    setFeedback(next);
    setHasVerdict(true);
    void save(next, true);
  }

  function toggleReason(reason: GenerationFeedbackReason) {
    editRevision.current += 1;
    setFeedback((current) => ({
      ...current,
      reasons: current.reasons.includes(reason)
        ? current.reasons.filter((item) => item !== reason)
        : [...current.reasons, reason],
    }));
    setSaveState("idle");
    setMessage(null);
  }

  return (
    <section
      aria-labelledby={`generation-feedback-${generationId}`}
      className="border-t border-white/10 px-3 py-5 sm:px-5 sm:py-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id={`generation-feedback-${generationId}`}
            className="text-base font-semibold text-foreground"
          >
            ¿Este resultado te sirve?
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Tu respuesta nos ayuda a reconocer qué decisiones visuales funcionan.
          </p>
        </div>
        <div
          className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 sm:flex"
          aria-label="Valorar resultado"
        >
          <button
            type="button"
            aria-pressed={hasVerdict && feedback.verdict === "useful"}
            disabled={saveState === "saving"}
            onClick={() => chooseVerdict("useful")}
            className={`inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60 ${
              hasVerdict && feedback.verdict === "useful"
                ? "bg-brand text-brand-ink shadow-[0_8px_24px_rgba(221,245,39,.12)]"
                : "bg-white/[0.055] text-foreground hover:bg-white/[0.09]"
            }`}
          >
            <ThumbsUp aria-hidden="true" className="size-4" />
            Me sirve
          </button>
          <button
            type="button"
            aria-pressed={hasVerdict && feedback.verdict === "not_useful"}
            disabled={saveState === "saving"}
            onClick={() => chooseVerdict("not_useful")}
            className={`inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60 ${
              hasVerdict && feedback.verdict === "not_useful"
                ? "bg-foreground text-background"
                : "bg-white/[0.055] text-foreground hover:bg-white/[0.09]"
            }`}
          >
            <ThumbsDown aria-hidden="true" className="size-4" />
            No me sirve
          </button>
        </div>
      </div>

      {hasVerdict ? (
        <form
          className="feedback-details-enter mt-6 border-t border-white/[0.08] pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            void save(feedback);
          }}
        >
          <fieldset>
            <legend className="text-sm font-semibold text-foreground">
              {feedback.verdict === "useful"
                ? "¿Qué fue decisivo?"
                : "¿Qué deberíamos corregir?"}
              <span className="ml-2 font-normal text-muted">Opcional</span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {GENERATION_FEEDBACK_REASONS.map(({ value, label }) => {
                const selected = feedback.reasons.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleReason(value)}
                    className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                      selected
                        ? "border-brand/50 bg-brand/10 text-brand"
                        : "border-white/12 text-muted hover:border-white/25 hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="mt-5 grid gap-2 text-sm font-semibold text-foreground">
            <span className="inline-flex items-center gap-2">
              <MessageSquareText aria-hidden="true" className="size-4 text-muted" />
              Comentario <span className="font-normal text-muted">Opcional</span>
            </span>
            <textarea
              value={feedback.comment ?? ""}
              maxLength={1000}
              rows={3}
              placeholder={
                feedback.verdict === "useful"
                  ? "Cuéntanos qué hizo que este resultado funcionara para ti."
                  : "Describe qué se aleja de lo que necesitabas."
              }
              onChange={(event) => {
                editRevision.current += 1;
                setFeedback((current) => ({
                  ...current,
                  comment: event.target.value || null,
                }));
                setSaveState("idle");
                setMessage(null);
              }}
              className="min-h-24 resize-y rounded-xl border border-white/12 bg-background px-4 py-3 text-sm font-normal leading-6 text-foreground outline-none placeholder:text-white/35 focus:border-brand/60"
            />
          </label>

          {feedback.verdict === "not_useful" ? (
            <div className="mt-5 border-t border-white/[0.08] pt-5">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={feedback.correctionRequested}
                  onChange={(event) => {
                    editRevision.current += 1;
                    setFeedback((current) => ({
                      ...current,
                      correctionRequested: event.target.checked,
                      correctionRequest: event.target.checked
                        ? current.correctionRequest
                        : null,
                    }));
                    setSaveState("idle");
                    setMessage(null);
                  }}
                  className="size-5 accent-[var(--brand)]"
                />
                <Wrench aria-hidden="true" className="size-4 text-brand" />
                Solicitar una corrección concreta
              </label>
              {feedback.correctionRequested ? (
                <label className="feedback-details-enter mt-3 grid gap-2 text-sm font-semibold text-foreground">
                  Indica exactamente qué debe cambiar
                  <textarea
                    required
                    minLength={10}
                    maxLength={1200}
                    rows={3}
                    value={feedback.correctionRequest ?? ""}
                    placeholder="Ejemplo: conserva mi rostro, elimina el segundo sujeto y cambia el texto por «El error que todos cometen»."
                    onChange={(event) => {
                      editRevision.current += 1;
                      setFeedback((current) => ({
                        ...current,
                        correctionRequest: event.target.value || null,
                      }));
                      setSaveState("idle");
                      setMessage(null);
                    }}
                    className="min-h-24 resize-y rounded-xl border border-white/12 bg-background px-4 py-3 text-sm font-normal leading-6 text-foreground outline-none placeholder:text-white/35 focus:border-brand/60"
                  />
                </label>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={saveState === "saving"}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink transition-colors hover:bg-[var(--brand-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60"
            >
              {saveState === "saving" ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : saveState === "saved" ? (
                <Check aria-hidden="true" className="size-4" />
              ) : null}
              {feedback.correctionRequested
                ? "Guardar y solicitar corrección"
                : "Guardar detalles"}
            </button>
            {message ? (
              <p
                role={saveState === "error" ? "alert" : "status"}
                className={`text-sm leading-5 ${
                  saveState === "error" ? "text-red-200" : "text-muted"
                }`}
              >
                {message}
              </p>
            ) : null}
          </div>
        </form>
      ) : null}
    </section>
  );
}
