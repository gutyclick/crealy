"use client";

import { CircleAlert, Clock3, LoaderCircle, RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { PublicJob } from "@/types/jobs";
import { trackConversion } from "@/lib/analytics/events";

const TERMINAL = new Set(["completed", "failed", "cancelled"]);

function messageFor(job: PublicJob | null) {
  if (!job) return "Preparando tu solicitud…";
  if (job.status === "queued") return "Tu solicitud está en la cola.";
  if (job.status === "retry_scheduled") return "La estamos intentando de nuevo de forma segura.";
  if (job.status === "claimed" || job.status === "processing") {
    return job.type === "generation"
      ? "Crealy está creando tu diseño."
      : "Crealy está preparando la nueva versión.";
  }
  if (job.status === "completed") return "Tu diseño está listo.";
  if (job.status === "cancelled") return "La solicitud fue cancelada.";
  return job.errorCode === "moderation_blocked"
    ? "La solicitud no pudo completarse por las políticas de seguridad. Ajusta la descripción e inténtalo otra vez."
    : "No pudimos completar la solicitud. Tus créditos fueron liberados.";
}

export function JobProgress({
  jobId,
  compact = false,
  onComplete,
  onDismiss,
}: {
  jobId: string;
  compact?: boolean;
  onComplete?: (job: PublicJob) => void;
  onDismiss?: () => void;
}) {
  const router = useRouter();
  const [job, setJob] = useState<PublicJob | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let delay = 1_200;
    async function poll() {
      try {
        const response = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        if (!response.ok) throw new Error("job_status_failed");
        const next = (await response.json()) as PublicJob;
        if (!active) return;
        setJob(next);
        setNetworkError(false);
        if (next.status === "completed") {
          if (next.type === "generation") {
            trackConversion("first_generation_completed");
          } else if (next.type === "edit") {
            trackConversion("first_edit_completed");
          }
          completeRef.current?.(next);
          router.refresh();
          return;
        }
        if (TERMINAL.has(next.status)) return;
        delay = Math.min(5_000, Math.round(delay * 1.35));
      } catch {
        if (!active) return;
        setNetworkError(true);
        delay = Math.min(8_000, Math.round(delay * 1.6));
      }
      timer = setTimeout(poll, delay);
    }
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [jobId, router]);

  async function cancel() {
    if (cancelling) return;
    setCancelling(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (response.ok) {
        setJob((current) => current ? { ...current, status: "cancelled" } : current);
        router.refresh();
      }
    } finally {
      setCancelling(false);
    }
  }

  const terminal = job ? TERMINAL.has(job.status) : false;
  const failed = job?.status === "failed" || job?.status === "cancelled";
  const Icon = failed ? CircleAlert : job?.status === "retry_scheduled" ? RotateCcw : Clock3;

  return (
    <div
      role="status"
      aria-live="polite"
      className={compact
        ? "rounded-xl border border-white/10 bg-white/[0.035] p-3"
        : "rounded-2xl border border-brand/20 bg-brand/[0.045] p-5 sm:p-6"}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
          {!terminal ? <LoaderCircle className="size-4 animate-spin" /> : <Icon className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{messageFor(job)}</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            {networkError
              ? "La conexión se interrumpió. Seguiremos consultando automáticamente."
              : job && !terminal
                ? `Intento ${Math.max(1, job.attemptCount)} de ${job.maxAttempts}. Puedes salir: el proceso continuará.`
                : "El estado se conserva aunque recargues o cierres esta página."}
          </p>
        </div>
        {job &&
        (job.status === "queued" || job.status === "retry_scheduled") ? (
          <button
            type="button"
            onClick={cancel}
            disabled={cancelling}
            aria-label="Cancelar solicitud"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-white/45 hover:bg-white/[0.06] hover:text-foreground disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        ) : failed && onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar estado"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-white/45 hover:bg-white/[0.06] hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
