"use client";

import {
  ArrowLeft,
  Archive,
  ArchiveRestore,
  Check,
  Download,
  GitCompareArrows,
  LoaderCircle,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { JobProgress } from "@/components/jobs/job-progress";
import { EDIT_SUGGESTIONS } from "@/config/editing";
import { cn } from "@/lib/utils";
import type {
  ApiErrorResponse,
  EditMessageView,
  EditSessionView,
} from "@/types/editing";
import type { QueuedEditResponse } from "@/types/jobs";

type EditorSubmitState =
  | "idle"
  | "submitting"
  | "queued"
  | "processing"
  | "saving"
  | "completed"
  | "failed";

function shortTime(value: string) {
  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function EditWorkspace({
  initialSession,
  available,
  initialPendingJobId = null,
}: {
  initialSession: EditSessionView;
  available: boolean;
  initialPendingJobId?: string | null;
}) {
  const router = useRouter();
  const [versions, setVersions] = useState(initialSession.versions);
  const [messages, setMessages] = useState(initialSession.messages);
  const [currentVersionId, setCurrentVersionId] = useState(
    initialSession.currentVersionId,
  );
  const [selectedVersionId, setSelectedVersionId] = useState(
    initialSession.currentVersionId,
  );
  const [instruction, setInstruction] = useState("");
  const [preserve, setPreserve] = useState(true);
  const [compare, setCompare] = useState(false);
  const [mobileCompareSide, setMobileCompareSide] = useState<
    "before" | "after"
  >("after");
  const [loading, setLoading] = useState(false);
  const [submitState, setSubmitState] = useState<EditorSubmitState>(
    initialPendingJobId ? "queued" : "idle",
  );
  const [pendingJobId, setPendingJobId] = useState<string | null>(
    initialPendingJobId,
  );
  const [restoring, setRestoring] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const submissionLockRef = useRef(Boolean(initialPendingJobId));

  const selected =
    versions.find((version) => version.id === selectedVersionId) ??
    versions.at(-1)!;
  const parent = useMemo(
    () => versions.find((version) => version.id === selected.parentVersionId),
    [selected, versions],
  );

  async function restoreSelected() {
    if (selected.id === currentVersionId || restoring) return;
    setRestoring(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/edit-sessions/${initialSession.id}/restore`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ versionId: selected.id }),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "No pudimos restaurarla.");
      setCurrentVersionId(selected.id);
      setVersions((items) =>
        items.map((item) => ({ ...item, isCurrent: item.id === selected.id })),
      );
      setMessages((items) => [
        ...items,
        {
          id: `restore-${crypto.randomUUID()}`,
          versionId: selected.id,
          role: "system",
          content: "Esta versión vuelve a ser la base de los próximos cambios.",
          createdAt: new Date().toISOString(),
        },
      ]);
      setCompare(false);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No pudimos restaurar esta versión.",
      );
    } finally {
      setRestoring(false);
    }
  }

  async function toggleArchive() {
    if (archiving) return;
    setArchiving(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/edit-sessions/${initialSession.id}/archive`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            archived: initialSession.status !== "archived",
          }),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "No pudimos actualizar la sesión.");
      }
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No pudimos actualizar la sesión.",
      );
    } finally {
      setArchiving(false);
    }
  }

  async function submit() {
    const clean = instruction.trim();
    if (clean.length < 10 || loading || submissionLockRef.current) {
      setError("Describe el cambio con al menos 10 caracteres.");
      return;
    }

    submissionLockRef.current = true;
    const clientRequestId = crypto.randomUUID();
    const optimisticMessage: EditMessageView = {
      id: `pending-${clientRequestId}`,
      versionId: null,
      role: "user",
      content: clean,
      createdAt: new Date().toISOString(),
    };
    setMessages((items) => [...items, optimisticMessage]);
    setLoading(true);
    setSubmitState("submitting");
    setError(null);
    queueMicrotask(() =>
      conversationRef.current?.scrollTo({
        top: conversationRef.current.scrollHeight,
        behavior: "smooth",
      }),
    );

    try {
      const response = await fetch(
        `/api/edit-sessions/${initialSession.id}/versions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientRequestId,
            baseVersionId: currentVersionId,
            instruction: clean,
            preserveUnmentionedElements: preserve,
          }),
        },
      );
      const result = (await response.json()) as
        | QueuedEditResponse
        | ApiErrorResponse;
      if (!response.ok || !("jobId" in result)) {
        throw new Error(
          "error" in result ? result.error : "No pudimos preparar la versión.",
        );
      }

      setPendingJobId(result.jobId);
      setSubmitState("queued");
      setMessages((items) =>
        items.map((item) =>
          item.id === optimisticMessage.id
            ? { ...item, versionId: result.versionId }
            : item,
        ),
      );
      setCompare(false);
    } catch (caught) {
      setMessages((items) =>
        items.filter((item) => item.id !== optimisticMessage.id),
      );
      setInstruction(clean);
      setSubmitState("failed");
      submissionLockRef.current = false;
      setError(
        caught instanceof Error
          ? caught.message
          : "No pudimos crear la versión.",
      );
    } finally {
      setLoading(false);
      queueMicrotask(() =>
        conversationRef.current?.scrollTo({
          top: conversationRef.current.scrollHeight,
          behavior: "smooth",
        }),
      );
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/edit"
            aria-label="Volver a editar"
            className="grid size-10 shrink-0 place-items-center rounded-xl text-muted hover:bg-white/[0.05] hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-foreground">
              {initialSession.title}
            </h1>
            <p className="text-xs text-muted">
              {versions.length} {versions.length === 1 ? "versión" : "versiones"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleArchive}
            disabled={archiving}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-white/[0.05] hover:text-foreground disabled:opacity-50"
          >
            {initialSession.status === "archived" ? (
              <ArchiveRestore aria-hidden="true" className="size-4" />
            ) : (
              <Archive aria-hidden="true" className="size-4" />
            )}
            <span className="hidden sm:inline">
              {initialSession.status === "archived" ? "Reactivar" : "Archivar"}
            </span>
          </button>
          <a
            href={`/api/edit-versions/${selected.id}/download`}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-foreground hover:bg-white/[0.05]"
          >
            <Download aria-hidden="true" className="size-4" />
            Descargar
          </a>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <section className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface p-2 sm:p-3">
            <div className="relative grid min-h-[22rem] place-items-center overflow-hidden rounded-xl bg-[#050505] sm:min-h-[34rem] xl:h-[calc(100dvh-15rem)] xl:min-h-[34rem]">
              {compare && parent?.imageUrl ? (
                <>
                  <div className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 rounded-xl border border-white/15 bg-black/80 p-1 md:hidden">
                    {(["before", "after"] as const).map((side) => (
                      <button
                        key={side}
                        type="button"
                        aria-pressed={mobileCompareSide === side}
                        onClick={() => setMobileCompareSide(side)}
                        className={cn(
                          "min-h-9 rounded-lg px-4 text-xs font-semibold",
                          mobileCompareSide === side
                            ? "bg-white text-black"
                            : "text-white/65",
                        )}
                      >
                        {side === "before" ? "Antes" : "Después"}
                      </button>
                    ))}
                  </div>
                  <div className="size-full md:hidden">
                    {/* Signed Supabase URL. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        mobileCompareSide === "before"
                          ? parent.imageUrl
                          : selected.imageUrl!
                      }
                      alt={
                        mobileCompareSide === "before"
                          ? "Versión anterior"
                          : "Versión seleccionada"
                      }
                      className="size-full object-contain"
                    />
                  </div>
                  <div className="hidden size-full md:grid md:grid-cols-2">
                  {[parent, selected].map((version, index) => (
                    <figure
                      key={version.id}
                      className="relative grid min-h-72 place-items-center overflow-hidden border-white/10 first:border-b md:first:border-b-0 md:first:border-r"
                    >
                      <figcaption className="absolute left-3 top-3 z-10 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-semibold text-white">
                        {index === 0 ? "Antes" : "Después"}
                      </figcaption>
                      {/* Signed Supabase URL. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={version.imageUrl!}
                        alt={index === 0 ? "Versión anterior" : "Versión seleccionada"}
                        className="max-h-full w-full object-contain"
                      />
                    </figure>
                  ))}
                  </div>
                </>
              ) : selected.imageUrl ? (
                // Signed Supabase URL.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={selected.id}
                  src={selected.imageUrl}
                  alt={`Versión ${versions.findIndex((item) => item.id === selected.id) + 1}`}
                  className="edit-image-arrival max-h-full w-full object-contain"
                />
              ) : (
                <p className="text-sm text-muted">Vista previa no disponible.</p>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted">
              {selected.instruction || "Imagen original"}
            </p>
            <div className="flex items-center gap-2">
              {parent ? (
                <button
                  type="button"
                  onClick={() => setCompare((value) => !value)}
                  aria-pressed={compare}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-semibold",
                    compare
                      ? "border-brand/40 bg-brand/[0.08] text-brand"
                      : "border-white/10 text-muted hover:text-foreground",
                  )}
                >
                  <GitCompareArrows aria-hidden="true" className="size-4" />
                  {compare ? "Ver una" : "Comparar"}
                </button>
              ) : null}
              {selected.id !== currentVersionId ? (
                <button
                  type="button"
                  onClick={restoreSelected}
                  disabled={restoring}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand px-3 text-xs font-bold text-brand-ink disabled:opacity-50"
                >
                  {restoring ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <RotateCcw className="size-4" />
                  )}
                  Usar esta versión
                </button>
              ) : (
                <span className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/[0.05] px-3 text-xs font-semibold text-white/65">
                  <Check aria-hidden="true" className="size-4 text-brand" />
                  Versión actual
                </span>
              )}
            </div>
          </div>

          <div
            className="mt-4 flex snap-x gap-2 overflow-x-auto pb-2"
            aria-label="Historial de versiones"
          >
            {versions.map((version, index) => (
              <button
                key={version.id}
                type="button"
                onClick={() => {
                  setSelectedVersionId(version.id);
                  setCompare(false);
                }}
                aria-pressed={selected.id === version.id}
                className={cn(
                  "group w-36 shrink-0 snap-start rounded-xl border p-2 text-left transition-colors sm:w-44",
                  selected.id === version.id
                    ? "border-brand/70 bg-brand/[0.04]"
                    : "border-white/10 bg-surface hover:border-white/20",
                )}
              >
                <span className="grid aspect-[16/9] place-items-center overflow-hidden rounded-lg bg-[#050505]">
                  {version.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={version.imageUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : null}
                </span>
                <span className="mt-2 flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-foreground">V{index + 1}</span>
                  {version.id === currentVersionId ? (
                    <span className="text-brand">Actual</span>
                  ) : null}
                </span>
                <span className="mt-1 block truncate text-xs text-muted">
                  {version.instruction || "Imagen original"}
                </span>
                <span className="mt-1 block text-xs text-white/45">
                  {shortDate(version.createdAt)}
                </span>
              </button>
            ))}
          </div>
        </section>

        <aside className="flex min-h-[38rem] flex-col rounded-2xl border border-white/10 bg-surface xl:h-[calc(100dvh-7.7rem)] xl:sticky xl:top-4">
          <div className="border-b border-white/[0.08] px-5 py-4">
            <h2 className="font-semibold text-foreground">Conversación</h2>
            <p className="mt-1 text-xs text-muted">
              Cada cambio crea una versión recuperable.
            </p>
          </div>

          <div
            ref={conversationRef}
            className="min-h-56 flex-1 space-y-4 overflow-y-auto px-4 py-5"
            aria-live="polite"
          >
            {messages.map((message) =>
              message.role === "system" ? (
                <p
                  key={message.id}
                  className="mx-auto max-w-[90%] text-center text-xs leading-5 text-white/55"
                >
                  {message.content}
                </p>
              ) : (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[92%]",
                    message.role === "user" ? "ml-auto" : "mr-auto",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-6",
                      message.role === "user"
                        ? "rounded-br-md bg-white/[0.08] text-foreground"
                        : "rounded-bl-md bg-[#191a15] text-white/80",
                    )}
                  >
                    {message.content}
                  </div>
                  <p className="mt-1 px-1 text-xs text-white/40">
                    {message.role === "user" ? "Tú" : "Crealy"} ·{" "}
                    {shortTime(message.createdAt)}
                  </p>
                </div>
              ),
            )}
            {loading ? (
              <div className="mr-auto flex max-w-[92%] items-center gap-3 rounded-2xl rounded-bl-md bg-[#191a15] px-4 py-3 text-sm text-white/70">
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-brand" />
                Creando una nueva versión…
              </div>
            ) : null}
            {pendingJobId ? (
              <JobProgress
                jobId={pendingJobId}
                compact
                onComplete={() => {
                  setSubmitState("saving");
                  setInstruction("");
                  setSubmitState("completed");
                  window.location.reload();
                }}
                onDismiss={() => {
                  setPendingJobId(null);
                  setSubmitState("failed");
                  submissionLockRef.current = false;
                }}
              />
            ) : null}
          </div>

          <div className="sticky bottom-0 border-t border-white/[0.08] bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] xl:static">
            {!available || initialSession.status !== "active" ? (
              <div
                role="status"
                className="mb-4 rounded-xl border border-amber-200/20 bg-amber-200/[0.06] px-3 py-2.5 text-sm leading-5 text-amber-100"
              >
                {!available
                  ? "La edición con IA está en mantenimiento. Puedes revisar, comparar y descargar tus versiones."
                  : "Esta sesión está archivada. Reactívala arriba para volver a crear versiones."}
              </div>
            ) : null}
            <p className="mb-2 text-xs font-medium text-white/60">
              Sugerencias rápidas
            </p>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 xl:flex-wrap">
              {EDIT_SUGGESTIONS.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInstruction(suggestion)}
                  className="shrink-0 rounded-full border border-white/10 px-3 py-2 text-xs text-white/70 hover:border-brand/35 hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <label className="mb-3 flex min-h-10 cursor-pointer items-center gap-3 text-sm text-white/72">
              <input
                type="checkbox"
                checked={preserve}
                onChange={(event) => setPreserve(event.target.checked)}
                className="size-4 accent-[#ddf527]"
              />
              Conservar el resto de la imagen
            </label>

            <label
              htmlFor="edit-instruction"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              ¿Qué quieres cambiar?
            </label>
            <textarea
              id="edit-instruction"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void submit();
                }
              }}
              maxLength={1000}
              rows={4}
              disabled={!available || initialSession.status !== "active"}
              placeholder="Ej. Haz que el producto destaque más y suaviza el fondo."
              className="w-full resize-none rounded-xl border border-white/12 bg-[#0a0a09] px-3.5 py-3 text-sm leading-6 text-foreground placeholder:text-white/38 focus:border-brand/55 focus:outline-none disabled:opacity-50"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-white/42">
              <span>Ctrl/⌘ + Enter</span>
              <span>{instruction.length}/1000</span>
            </div>
            {error ? (
              <p role="alert" className="mt-3 text-sm leading-5 text-red-300">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              onClick={submit}
              disabled={
                loading ||
                Boolean(pendingJobId) ||
                !available ||
                initialSession.status !== "active" ||
                instruction.trim().length < 10
              }
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-45"
            >
              {loading ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Sparkles aria-hidden="true" className="size-4" />
              )}
              {pendingJobId
                ? submitState === "saving"
                  ? "Guardando…"
                  : "Aplicando cambios…"
                : loading
                  ? "Enviando…"
                  : submitState === "failed"
                    ? "Intentar nuevamente"
                  : "Aplicar cambios"}
              {!loading ? <Send aria-hidden="true" className="size-4" /> : null}
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
