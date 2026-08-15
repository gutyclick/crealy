"use client";

import Image from "next/image";
import { Check, ImagePlus, Link2, LoaderCircle, Sparkles, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import type { ReferenceDraft } from "@/components/generation/reference-image-picker";
import { RecreateBlueprintEditor } from "@/components/recreate/recreate-blueprint-editor";
import { MAX_GENERATION_REFERENCE_IMAGES } from "@/config/generation";
import {
  DEFAULT_RECREATE_PRESERVATION,
  RECREATE_PRESERVATION_OPTIONS,
  RECREATE_REFERENCE_ROLES,
} from "@/config/recreate";
import { buildFallbackBlueprint } from "@/lib/recreate/default-blueprint";
import { cn } from "@/lib/utils";
import { readApiResponse } from "@/lib/uploads/read-api-response";
import { uploadPrivateImage } from "@/lib/uploads/upload-private-image";
import type {
  RecreateBlueprint,
  RecreateCategory,
  RecreateFocus,
  RecreateGoal,
  RecreatePreservation,
  RecreatePreservationKey,
  RecreateReferenceRole,
  RecreateSimilarity,
} from "@/types/recreate";

export type RecreateState = {
  similarity: RecreateSimilarity;
  focus: RecreateFocus;
  goal: RecreateGoal;
  preservation: RecreatePreservation;
  blueprint?: RecreateBlueprint;
  ready: boolean;
};

const ACCEPTED_REFERENCE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function legacyFocusForPreservation(key: RecreatePreservationKey): RecreateFocus {
  if (key === "pose") return "subject";
  if (key === "typography") return "text";
  if (key === "lighting" || key === "colors") return "atmosphere";
  return "composition";
}

export function RecreatePanel({ category, references, setReferences, disabled, maxFileMb, onChange }: {
  category: RecreateCategory;
  references: ReferenceDraft[];
  setReferences: React.Dispatch<React.SetStateAction<ReferenceDraft[]>>;
  disabled: boolean;
  maxFileMb: number;
  onChange: (state: RecreateState) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const supportingInputRef = useRef<HTMLInputElement>(null);
  const blueprintEditedRef = useRef(false);
  const [url, setUrl] = useState("");
  const [similarity, setSimilarity] = useState<RecreateSimilarity>("similar");
  const [goal, setGoal] = useState<RecreateGoal>("performance");
  const [preservation, setPreservation] = useState<RecreatePreservation>({ ...DEFAULT_RECREATE_PRESERVATION });
  const [blueprint, setBlueprint] = useState<RecreateBlueprint>();
  const stateRef = useRef<RecreateState>({
    similarity: "similar",
    focus: "composition",
    goal: "performance",
    preservation: { ...DEFAULT_RECREATE_PRESERVATION },
    ready: false,
  });
  const [status, setStatus] = useState<"empty" | "loading" | "analyzing" | "ready" | "error">("empty");
  const [message, setMessage] = useState("");
  const [supportingError, setSupportingError] = useState("");
  const source = references[0];
  const supportingReferences = references.slice(1);
  const busy = status === "loading" || status === "analyzing";

  function emitChange(patch: Partial<RecreateState>) {
    stateRef.current = { ...stateRef.current, ...patch };
    onChange(stateRef.current);
  }

  function togglePreservation(key: RecreatePreservationKey) {
    const next = { ...preservation, [key]: !preservation[key] };
    setPreservation(next);
    emitChange({ preservation: next, focus: legacyFocusForPreservation(key) });
  }

  function updateReferenceRole(key: string, role: RecreateReferenceRole) {
    setReferences((current) => current.map((reference) =>
      reference.key === key ? { ...reference, recreateRole: role } : reference,
    ));
  }

  function addSupportingReferences(files: File[]) {
    setSupportingError("");
    const remaining = MAX_GENERATION_REFERENCE_IMAGES - references.length;
    if (remaining <= 0) {
      setSupportingError(`Puedes usar hasta ${MAX_GENERATION_REFERENCE_IMAGES} imágenes en total.`);
      return;
    }

    const accepted: ReferenceDraft[] = [];
    for (const file of files.slice(0, remaining)) {
      if (!ACCEPTED_REFERENCE_TYPES.has(file.type)) {
        setSupportingError("Usa imágenes PNG, JPEG o WebP para los sujetos y elementos.");
        continue;
      }
      if (file.size > maxFileMb * 1024 * 1024) {
        setSupportingError(`Cada imagen puede pesar hasta ${maxFileMb} MB.`);
        continue;
      }
      const duplicate = [...references, ...accepted].some((item) =>
        item.file.name === file.name &&
        item.file.size === file.size &&
        item.file.lastModified === file.lastModified,
      );
      if (duplicate) {
        setSupportingError("Una de esas imágenes ya está seleccionada.");
        continue;
      }
      const supportingPosition = supportingReferences.length + accepted.length;
      accepted.push({
        key: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        recreateRole: supportingPosition === 0 ? "protagonist" : "supporting",
        status: "ready",
      });
    }

    if (accepted.length) {
      setReferences((current) => [...current, ...accepted].slice(0, MAX_GENERATION_REFERENCE_IMAGES));
      setMessage(files.length > remaining
        ? `Se añadieron ${remaining}. El máximo es ${MAX_GENERATION_REFERENCE_IMAGES} imágenes en total.`
        : "Material adicional listo. Define el papel de cada imagen para ganar precisión.");
    }
  }

  async function prepare(file: File) {
    if (!ACCEPTED_REFERENCE_TYPES.has(file.type)) {
      setStatus("error");
      setMessage("Usa una imagen PNG, JPEG o WebP como referencia base.");
      return;
    }
    if (file.size > maxFileMb * 1024 * 1024) {
      setStatus("error");
      setMessage(`La referencia base puede pesar hasta ${maxFileMb} MB.`);
      return;
    }
    setStatus("analyzing");
    setMessage("");
    blueprintEditedRef.current = false;
    setBlueprint(undefined);
    emitChange({ similarity, goal, preservation, blueprint: undefined, ready: false });
    const key = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);
    setReferences((current) => {
      if (current[0]) URL.revokeObjectURL(current[0].previewUrl);
      return [{ key, file, previewUrl, status: "uploading" }, ...current.slice(1, MAX_GENERATION_REFERENCE_IMAGES)];
    });
    try {
      const upload = await uploadPrivateImage(file, "reference");
      setReferences((current) => current.map((item, index) =>
        index === 0 ? { ...item, uploadId: upload.uploadId, status: "uploaded" } : item,
      ));
      const fallback = buildFallbackBlueprint(category);
      setBlueprint(fallback);
      setStatus("ready");
      setMessage("Referencia lista. Puedes continuar mientras afinamos su lectura visual.");
      emitChange({ blueprint: fallback, ready: true });
      const response = await fetch("/api/recreate/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: upload.uploadId, category }),
      });
      const payload = await readApiResponse<
        { blueprint: RecreateBlueprint; fallback?: boolean } | { error: string }
      >(response, "No pudimos analizar esta referencia.");
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "No pudimos analizar esta referencia.");
      }
      setStatus("ready");
      if (blueprintEditedRef.current) {
        setMessage("Lectura lista. Conservamos los ajustes que hiciste.");
      } else {
        setMessage(payload.fallback
          ? "Referencia lista. Crealy completará la interpretación visual al generar."
          : "Lectura visual afinada. Puedes revisarla o continuar.");
        setBlueprint(payload.blueprint);
        emitChange({ blueprint: payload.blueprint, ready: true });
      }
    } catch {
      const fallback = buildFallbackBlueprint(category);
      setBlueprint(fallback);
      setStatus("ready");
      setMessage("Referencia lista. Usaremos su composición directamente al generar.");
      emitChange({ blueprint: fallback, ready: true });
    }
  }

  async function loadUrl() {
    if (!url.trim() || disabled || busy) return;
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/recreate/reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        const payload = await readApiResponse<{ error: string }>(response, "La referencia no es válida.");
        throw new Error(payload.error);
      }
      const blob = await response.blob();
      await prepare(new File([blob], "referencia-recreate.webp", { type: blob.type }));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "La referencia no es válida.");
    }
  }

  return (
    <section className="mt-7 overflow-hidden rounded-2xl border border-brand/20 bg-brand/[0.035]">
      <div className="border-b border-white/8 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink">
            <Sparkles aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Recrea un diseño que ya funciona</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              Añade una pieza de referencia. Crealy extraerá su fórmula visual y la reconstruirá con tu contenido.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_15rem]">
        <div>
          <label htmlFor="recreate-url" className="text-sm font-semibold text-foreground">
            Pega un enlace o sube una imagen
          </label>
          <div className="mt-3 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Link2 aria-hidden="true" className="absolute left-3 top-3.5 size-4 text-muted" />
              <input
                id="recreate-url"
                value={url}
                disabled={disabled || busy}
                onChange={(event) => setUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void loadUrl();
                  }
                }}
                placeholder="https://youtube.com/watch?v=..."
                className="h-12 w-full rounded-xl bg-background pl-10 pr-3 text-base text-foreground outline-none ring-1 ring-white/10 focus:ring-brand/65 disabled:opacity-50"
              />
            </div>
            <button type="button" onClick={loadUrl} disabled={disabled || busy} className="min-h-12 rounded-xl bg-white px-4 text-sm font-bold text-black disabled:opacity-50">
              Analizar
            </button>
          </div>
          <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-[.16em] text-muted">
            <span className="h-px flex-1 bg-white/8" />o<span className="h-px flex-1 bg-white/8" />
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void prepare(file);
              event.target.value = "";
            }}
          />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled || busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-background text-sm font-semibold text-foreground transition-colors hover:border-brand/45 disabled:opacity-50">
            <Upload aria-hidden="true" className="size-4 text-brand" />Subir imagen
          </button>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-xl bg-background ring-1 ring-white/10">
          {source ? (
            <Image src={source.previewUrl} alt="Vista previa de la referencia base" fill unoptimized className="object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-center text-xs text-muted">
              <span><ImagePlus aria-hidden="true" className="mx-auto mb-2 size-6" />Tu referencia aparecerá aquí</span>
            </div>
          )}
          {busy ? (
            <div role="status" aria-live="polite" className="absolute inset-0 grid place-items-center bg-black/70 text-xs font-semibold text-white">
              <span className="flex items-center gap-2">
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-brand" />
                {status === "loading" ? "Obteniendo imagen" : "Entendiendo la fórmula"}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {status === "ready" ? (
        <div role="status" aria-live="polite" className="mx-5 mb-5 flex items-center gap-2 rounded-xl bg-brand/10 px-4 py-3 text-sm font-semibold text-foreground ring-1 ring-brand/25 sm:mx-6 sm:mb-6">
          <Check aria-hidden="true" className="size-4 shrink-0 text-brand" />
          {message || "Crealy entendió la composición, la jerarquía y la energía visual."}
        </div>
      ) : null}
      {status === "error" ? (
        <p role="alert" className="mx-5 mb-5 rounded-xl bg-red-950/40 px-4 py-3 text-sm text-red-100 sm:mx-6 sm:mb-6">{message}</p>
      ) : null}

      {status === "ready" && blueprint ? (
        <RecreateBlueprintEditor
          blueprint={blueprint}
          disabled={disabled || busy}
          onChange={(nextBlueprint) => {
            blueprintEditedRef.current = true;
            setBlueprint(nextBlueprint);
            emitChange({ blueprint: nextBlueprint });
          }}
        />
      ) : null}

      {status === "ready" ? (
        <div className="border-t border-white/8 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Sujetos, productos o elementos <span className="font-normal text-muted">(opcional)</span>
              </p>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
                La primera imagen define la fórmula. Añade hasta 3 imágenes propias y dinos qué papel cumple cada una.
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-background px-2.5 py-1 text-xs font-semibold text-muted ring-1 ring-white/10">
              {references.length}/{MAX_GENERATION_REFERENCE_IMAGES}
            </span>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/55">
            Para mayor fidelidad, usa una persona u objeto por imagen, con buena luz y sin elementos que oculten sus rasgos.
          </p>
          <input
            ref={supportingInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              addSupportingReferences(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {supportingReferences.map((reference, index) => (
              <div key={reference.key} className="min-w-0">
                <div className="group relative aspect-square overflow-hidden rounded-xl bg-background ring-1 ring-white/10">
                  <Image src={reference.previewUrl} alt={`Material adicional ${index + 1}`} fill unoptimized className="object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/75 px-1.5 py-1 text-[0.625rem] font-semibold text-white">S{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(reference.previewUrl);
                      setReferences((current) => current.filter((item) => item.key !== reference.key));
                      setSupportingError("");
                    }}
                    disabled={disabled || busy}
                    aria-label={`Quitar material adicional ${index + 1}`}
                    className="absolute right-0 top-0 grid size-11 place-items-center text-white"
                  >
                    <span className="grid size-7 place-items-center rounded-lg bg-black/80"><X aria-hidden="true" className="size-4" /></span>
                  </button>
                </div>
                <label className="mt-2 block">
                  <span className="sr-only">Papel del material adicional {index + 1}</span>
                  <select
                    value={reference.recreateRole ?? "supporting"}
                    disabled={disabled || busy}
                    onChange={(event) => updateReferenceRole(reference.key, event.target.value as RecreateReferenceRole)}
                    className="min-h-11 w-full rounded-xl border border-white/10 bg-background px-2.5 text-xs font-semibold text-foreground outline-none focus:border-brand/60"
                  >
                    {RECREATE_REFERENCE_ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
                  </select>
                </label>
              </div>
            ))}
            {references.length < MAX_GENERATION_REFERENCE_IMAGES ? (
              <button type="button" onClick={() => supportingInputRef.current?.click()} disabled={disabled || busy} className="group grid aspect-square min-h-24 place-items-center rounded-xl border border-dashed border-white/15 bg-background text-center transition-colors hover:border-brand/45 disabled:opacity-50">
                <span><ImagePlus aria-hidden="true" className="mx-auto size-5 text-brand" /><span className="mt-1.5 block text-xs font-semibold text-foreground">Añadir</span></span>
              </button>
            ) : null}
          </div>
          {supportingError ? <p role="alert" className="mt-3 text-xs leading-5 text-red-300">{supportingError}</p> : null}
        </div>
      ) : null}

      <div className="grid border-t border-white/8 sm:grid-cols-2">
        <fieldset className="p-5 sm:p-6">
          <legend className="px-0 text-sm font-semibold text-foreground">Conserva de la referencia</legend>
          <p className="mt-1 text-xs leading-5 text-muted">Puedes combinar varios aspectos o desmarcarlos para reinterpretarlos.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {RECREATE_PRESERVATION_OPTIONS.map((item) => {
              const selected = preservation[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => togglePreservation(item.id)}
                  className={cn("min-h-14 rounded-xl px-3 py-2.5 text-left ring-1 transition-colors", selected ? "bg-brand/10 ring-brand/60" : "bg-background ring-white/10")}
                >
                  <span className="block text-xs font-semibold text-foreground">{item.label}</span>
                  <span className="mt-1 block text-xs leading-4 text-muted">{item.detail}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="border-t border-white/8 p-5 sm:border-l sm:border-t-0 sm:p-6">
          <legend className="px-0 text-sm font-semibold text-foreground">Qué quieres mejorar</legend>
          <p className="mt-1 text-xs leading-5 text-muted">Define la dirección del nuevo resultado.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {([
              { id: "performance", label: "Más clics" },
              { id: "clean", label: "Más limpio" },
              { id: "premium", label: "Más premium" },
              { id: "bold", label: "Más impacto" },
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={goal === item.id}
                onClick={() => { setGoal(item.id); emitChange({ goal: item.id }); }}
                className={cn("min-h-14 rounded-xl px-3 text-left text-xs font-semibold ring-1 transition-colors", goal === item.id ? "bg-brand/10 text-foreground ring-brand/60" : "bg-background text-muted ring-white/10")}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <fieldset className="border-t border-white/8 p-5 sm:p-6">
        <legend className="px-0 text-sm font-semibold text-foreground">Nivel de parecido</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {([
            { id: "inspired", label: "Inspirado", detail: "Nueva composición" },
            { id: "similar", label: "Equilibrado", detail: "Recomendado" },
            { id: "very_similar", label: "Cercano", detail: "Misma lógica visual" },
          ] as const).map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={similarity === item.id}
              onClick={() => { setSimilarity(item.id); emitChange({ similarity: item.id }); }}
              className={cn("min-h-14 rounded-xl p-3 text-left ring-1 transition-colors", similarity === item.id ? "bg-brand/10 ring-brand/60" : "bg-background ring-white/10")}
            >
              <span className="block text-sm font-semibold text-foreground">{item.label}</span>
              <span className="mt-1 block text-xs text-muted">{item.detail}</span>
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
