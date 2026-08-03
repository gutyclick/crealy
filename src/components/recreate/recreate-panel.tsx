"use client";

import { Check, ImagePlus, Link2, LoaderCircle, Sparkles, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import Image from "next/image";

import type { ReferenceDraft } from "@/components/generation/reference-image-picker";
import { cn } from "@/lib/utils";
import { readApiResponse } from "@/lib/uploads/read-api-response";
import { uploadPrivateImage } from "@/lib/uploads/upload-private-image";
import type { RecreateBlueprint, RecreateCategory, RecreateSimilarity } from "@/types/recreate";

export type RecreateState = { similarity: RecreateSimilarity; blueprint?: RecreateBlueprint; ready: boolean };

export function RecreatePanel({ category, references, setReferences, disabled, maxFileMb, onChange }: {
  category: RecreateCategory;
  references: ReferenceDraft[];
  setReferences: React.Dispatch<React.SetStateAction<ReferenceDraft[]>>;
  disabled: boolean;
  maxFileMb: number;
  onChange: (state: RecreateState) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const protagonistInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [similarity, setSimilarity] = useState<RecreateSimilarity>("similar");
  const [status, setStatus] = useState<"empty" | "loading" | "analyzing" | "ready" | "error">("empty");
  const [message, setMessage] = useState("");
  const source = references[0];
  const protagonist = references[1];
  const busy = status === "loading" || status === "analyzing";

  function addProtagonist(file: File) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setStatus("error"); setMessage("Usa una imagen PNG, JPEG o WebP para el protagonista."); return;
    }
    if (file.size > maxFileMb * 1024 * 1024) {
      setStatus("error"); setMessage(`La imagen del protagonista puede pesar hasta ${maxFileMb} MB.`); return;
    }
    const draft: ReferenceDraft = { key: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file), status: "ready" };
    setReferences((current) => {
      if (current[1]) URL.revokeObjectURL(current[1].previewUrl);
      return current[0] ? [current[0], draft] : current;
    });
  }

  async function prepare(file: File) {
    setStatus("analyzing"); setMessage("");
    onChange({ similarity, ready: false });
    const key = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);
    setReferences((current) => [{ key, file, previewUrl, status: "uploading" }, ...current.slice(1)]);
    try {
      const upload = await uploadPrivateImage(file, "reference");
      setReferences((current) => current.map((item, index) => index === 0 ? { ...item, uploadId: upload.uploadId, status: "uploaded" } : item));
      const response = await fetch("/api/recreate/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uploadId: upload.uploadId, category }) });
      const payload = await readApiResponse<{ blueprint: RecreateBlueprint; fallback?: boolean } | { error: string }>(response, "No pudimos analizar esta referencia.");
      if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error : "No pudimos analizar esta referencia.");
      setStatus("ready"); setMessage(payload.fallback ? "Referencia lista. Crealy completará la interpretación visual al generar." : ""); onChange({ similarity, blueprint: payload.blueprint, ready: true });
    } catch (error) {
      setStatus("error"); setMessage(error instanceof Error ? error.message : "No pudimos analizar esta referencia."); onChange({ similarity, ready: false });
    }
  }

  async function loadUrl() {
    if (!url.trim() || disabled || busy) return;
    setStatus("loading"); setMessage("");
    try {
      const response = await fetch("/api/recreate/reference", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      if (!response.ok) { const payload = await readApiResponse<{ error: string }>(response, "La referencia no es válida."); throw new Error(payload.error); }
      const blob = await response.blob();
      await prepare(new File([blob], "referencia-recreate.webp", { type: blob.type }));
    } catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "La referencia no es válida."); }
  }

  return <section className="mt-7 overflow-hidden rounded-2xl border border-brand/20 bg-brand/[0.035]">
    <div className="border-b border-white/8 p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink"><Sparkles className="size-5" /></span><div><h2 className="text-lg font-semibold tracking-tight text-foreground">Recrea un diseño que ya funciona</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Pega un enlace o sube una imagen. Crealy entenderá su fórmula visual y creará una versión original con tu contenido.</p></div></div></div>
    <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_15rem]">
      <div><label htmlFor="recreate-url" className="text-sm font-semibold text-foreground">Pega un enlace o sube una imagen</label><div className="mt-3 flex gap-2"><div className="relative min-w-0 flex-1"><Link2 className="absolute left-3 top-3.5 size-4 text-muted" /><input id="recreate-url" value={url} disabled={disabled || busy} onChange={(e) => setUrl(e.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void loadUrl(); } }} placeholder="https://youtube.com/watch?v=..." className="h-12 w-full rounded-xl bg-background pl-10 pr-3 text-base text-foreground outline-none ring-1 ring-white/10 focus:ring-brand/65 disabled:opacity-50" /></div><button type="button" onClick={loadUrl} disabled={disabled || busy} className="rounded-xl bg-white px-4 text-sm font-bold text-black disabled:opacity-50">Analizar</button></div>
        <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-[.16em] text-muted"><span className="h-px flex-1 bg-white/8" />o<span className="h-px flex-1 bg-white/8" /></div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void prepare(file); event.target.value = ""; }} /><button type="button" onClick={() => inputRef.current?.click()} disabled={disabled || busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-background text-sm font-semibold text-foreground hover:border-brand/45 disabled:opacity-50"><Upload className="size-4 text-brand" />Subir imagen</button>
      </div>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-background ring-1 ring-white/10">{source ? <Image src={source.previewUrl} alt="Vista previa de la referencia" fill unoptimized className="object-cover" /> : <div className="grid h-full place-items-center text-center text-xs text-muted"><span><ImagePlus className="mx-auto mb-2 size-6" />Tu referencia aparecerá aquí</span></div>}{status === "loading" || status === "analyzing" ? <div role="status" aria-live="polite" className="absolute inset-0 grid place-items-center bg-black/70 text-xs font-semibold text-white"><span className="flex items-center gap-2"><LoaderCircle className="size-4 animate-spin text-brand" />{status === "loading" ? "Obteniendo imagen" : "Entendiendo la fórmula"}</span></div> : null}</div>
    </div>
    {status === "ready" ? <div role="status" aria-live="polite" className="mx-5 mb-5 flex items-center gap-2 rounded-xl bg-brand/10 px-4 py-3 text-sm font-semibold text-foreground ring-1 ring-brand/25 sm:mx-6 sm:mb-6"><Check className="size-4 text-brand" />{message || "Crealy entendió la composición, la jerarquía y la energía visual."}</div> : null}
    {status === "error" ? <p role="alert" className="mx-5 mb-5 rounded-xl bg-red-950/40 px-4 py-3 text-sm text-red-100 sm:mx-6 sm:mb-6">{message}</p> : null}
    {status === "ready" ? <div className="border-t border-white/8 p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold text-foreground">Protagonista o producto <span className="font-normal text-muted">(opcional)</span></p><p className="mt-1 text-xs leading-5 text-muted">Añade tu propia persona, producto u objeto. Crealy preservará sus rasgos principales.</p></div>{protagonist ? <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-background ring-1 ring-white/10"><Image src={protagonist.previewUrl} alt="Protagonista seleccionado" fill unoptimized className="object-cover" /></div> : null}</div><input ref={protagonistInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) addProtagonist(file); event.target.value = ""; }} /><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => protagonistInputRef.current?.click()} disabled={disabled || busy} className="flex min-h-11 items-center gap-2 rounded-xl bg-background px-4 text-sm font-semibold text-foreground ring-1 ring-white/10 transition-colors hover:ring-brand/45"><ImagePlus className="size-4 text-brand" />{protagonist ? "Cambiar imagen" : "Añadir protagonista"}</button>{protagonist ? <button type="button" onClick={() => { URL.revokeObjectURL(protagonist.previewUrl); setReferences((current) => current.slice(0, 1)); }} disabled={disabled || busy} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground"><X className="size-4" />Quitar</button> : null}</div></div> : null}
    <fieldset className="border-t border-white/8 p-5 sm:p-6"><legend className="px-0 text-sm font-semibold text-foreground">¿Qué tan cerca quieres estar de la referencia?</legend><div className="mt-3 grid gap-2 sm:grid-cols-3">{([{ id: "inspired", label: "Inspirado", detail: "Más libertad creativa" }, { id: "similar", label: "Similar", detail: "Equilibrio recomendado" }, { id: "very_similar", label: "Muy similar", detail: "Estructura más cercana" }] as const).map((item) => <button key={item.id} type="button" aria-pressed={similarity === item.id} onClick={() => { setSimilarity(item.id); onChange({ similarity: item.id, ready: status === "ready" }); }} className={cn("rounded-xl p-3 text-left ring-1", similarity === item.id ? "bg-brand/10 ring-brand/60" : "bg-background ring-white/10")}><span className="block text-sm font-semibold text-foreground">{item.label}</span><span className="mt-1 block text-xs text-muted">{item.detail}</span></button>)}</div></fieldset>
  </section>;
}
