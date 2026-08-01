"use client";

import { CopyPlus, LoaderCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { CREATION_QUEUED_EVENT } from "@/components/dashboard/creation-notification-center";
import { trackConversion } from "@/lib/analytics/events";
import { readApiResponse } from "@/lib/uploads/read-api-response";
import type { GenerationErrorResponse, ThumbnailPreset, ThumbnailTextMode } from "@/types/generation";
import type { QueuedGenerationResponse } from "@/types/jobs";

type FollowupKind = "variation" | "concepts";

export function ThumbnailFollowupActions({ generationId, projectId, topic, videoTitle, preset, textMode, primaryText, referenceUploadIds }: {
  generationId: string; projectId: string; topic: string; videoTitle?: string; preset: ThumbnailPreset;
  textMode: ThumbnailTextMode; primaryText?: string; referenceUploadIds: string[];
}) {
  const [loading, setLoading] = useState<FollowupKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function queueOne(description: string, label: string, generationIntent: "variation" | "additional_concept") {
    const response = await fetch("/api/generations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientRequestId: crypto.randomUUID(), projectId, contentType: "thumbnail", platform: "youtube",
        description, videoTitle, thumbnailPreset: preset, thumbnailTextMode: textMode,
        primaryText: textMode === "custom" ? primaryText : undefined,
        style: "automatic", colorPreference: "auto", variant: "thumbnail-standard",
        format: "thumbnail-standard", quality: "standard",
        referenceUploadIds: referenceUploadIds.length ? referenceUploadIds : undefined,
        generationIntent,
        parentGenerationId: generationId,
      }),
    });
    const payload = await readApiResponse<QueuedGenerationResponse | GenerationErrorResponse>(response, "No pudimos preparar la nueva miniatura.");
    if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error : "No pudimos preparar la nueva miniatura.");
    window.dispatchEvent(new CustomEvent(CREATION_QUEUED_EVENT, { detail: {
      jobId: payload.jobId, generationId: payload.generationId, label,
      status: payload.status, createdAt: new Date().toISOString(), unread: true,
    } }));
  }

  async function run(kind: FollowupKind) {
    if (loading) return;
    setLoading(kind);
    setError(null);
    try {
      if (kind === "variation") {
        await queueOne(`${topic}\n\nCrea una variación con un concepto o composición claramente diferente al resultado anterior.`, "Variación de miniatura", "variation");
        trackConversion("thumbnail_variation_requested", { credit_cost: 1 });
      } else {
        await queueOne(`${topic}\n\nExplora una dirección más clara y directa, con una composición distinta.`, "Concepto adicional · claridad", "additional_concept");
        await queueOne(`${topic}\n\nExplora una dirección más emocional o curiosa, con otra composición.`, "Concepto adicional · emoción", "additional_concept");
        trackConversion("thumbnail_concepts_requested", { credit_cost: 2 });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos preparar la solicitud.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-2 grid gap-2">
      <button type="button" onClick={() => run("variation")} disabled={Boolean(loading)} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-foreground hover:bg-white/[0.05] disabled:opacity-45">
        {loading === "variation" ? <LoaderCircle className="size-4 animate-spin" /> : <CopyPlus className="size-4" />} Crear variación · 1 crédito
      </button>
      <button type="button" onClick={() => run("concepts")} disabled={Boolean(loading)} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-foreground hover:bg-white/[0.05] disabled:opacity-45">
        {loading === "concepts" ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Generar 2 conceptos más · 2 créditos
      </button>
      {error ? <p role="alert" className="text-xs leading-5 text-red-200">{error}</p> : null}
    </div>
  );
}
