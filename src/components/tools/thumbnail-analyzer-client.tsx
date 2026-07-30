"use client";

import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ImageMetadata } from "@/components/tools/image-metadata";
import { ToolResultPanel } from "@/components/tools/tool-result-panel";
import { ToolUploadZone } from "@/components/tools/tool-upload-zone";
import { readLocalImage } from "@/lib/tools/local-image";
import { parseYouTubeUrl } from "@/lib/youtube/parse-youtube-url";
import type { LocalImage, ThumbnailAnalysis } from "@/types/tools";

const labels: Record<keyof ThumbnailAnalysis["categories"], string> = {
  composition: "Composición",
  textLegibility: "Legibilidad",
  visualHierarchy: "Jerarquía visual",
  contrast: "Contraste",
  smallSizeClarity: "Claridad en pequeño",
  focus: "Foco",
};

export function ThumbnailAnalyzerClient() {
  const [image, setImage] = useState<LocalImage | null>(null);
  const [analysis, setAnalysis] = useState<ThumbnailAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);
  const [cost, setCost] = useState<number | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loadingYoutube, setLoadingYoutube] = useState(false);

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );

  async function analyze() {
    if (!image) return;
    setLoading(true);
    setError("");
    setUnauthorized(false);
    setAnalysis(null);
    const form = new FormData();
    form.set("image", image.file);
    form.set("clientRequestId", crypto.randomUUID());
    try {
      const response = await fetch("/api/tools/thumbnail-analyzer", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as {
        analysis?: ThumbnailAnalysis;
        error?: string;
        creditCost?: number;
      };
      if (!response.ok || !data.analysis) {
        if (response.status === 401) setUnauthorized(true);
        throw new Error(data.error || "No pudimos analizar la miniatura.");
      }
      setAnalysis(data.analysis);
      setCost(data.creditCost ?? 0);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No pudimos analizar la miniatura.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadFromYouTube() {
    setError("");
    setLoadingYoutube(true);
    try {
      const videoId = parseYouTubeUrl(youtubeUrl);
      let response = await fetch(
        `/api/tools/youtube/thumbnails/${videoId}/maxres`,
      );
      if (!response.ok) {
        response = await fetch(
          `/api/tools/youtube/thumbnails/${videoId}/high`,
        );
      }
      if (!response.ok) throw new Error("No encontramos una miniatura disponible.");
      const blob = await response.blob();
      const next = await readLocalImage(
        new File([blob], `youtube-${videoId}.jpg`, {
          type: blob.type || "image/jpeg",
        }),
      );
      if (image) URL.revokeObjectURL(image.url);
      setImage(next);
      setAnalysis(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No pudimos cargar la miniatura.",
      );
    } finally {
      setLoadingYoutube(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <ToolResultPanel
          title="Miniatura a revisar"
          description="La imagen se envía de forma temporal a OpenAI para realizar el análisis y no se guarda como archivo."
          className="h-fit"
        >
          <ToolUploadZone
            onImage={(next) => {
              if (image) URL.revokeObjectURL(image.url);
              setImage(next);
              setAnalysis(null);
            }}
            compact
          />
          <div className="my-4 flex items-center gap-3 text-xs text-white/35">
            <span className="h-px flex-1 bg-white/[0.08]" />
            o usa YouTube
            <span className="h-px flex-1 bg-white/[0.08]" />
          </div>
          <label
            htmlFor="analyzer-youtube-url"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            URL del video
          </label>
          <input
            id="analyzer-youtube-url"
            type="url"
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            placeholder="https://youtu.be/…"
            className="h-11 w-full rounded-xl bg-white/[0.055] px-3.5 text-sm text-foreground outline-none ring-brand placeholder:text-white/35 focus:ring-2"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3 w-full"
            disabled={!youtubeUrl || loadingYoutube}
            onClick={() => void loadFromYouTube()}
          >
            {loadingYoutube && (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            )}
            {loadingYoutube ? "Cargando miniatura" : "Cargar desde YouTube"}
          </Button>
          {image && (
            <div className="mt-5 overflow-hidden rounded-xl bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt="Miniatura a analizar"
                className="aspect-video w-full object-cover"
              />
            </div>
          )}
          <Button
            type="button"
            onClick={() => void analyze()}
            disabled={!image || loading}
            className="mt-5 w-full"
          >
            {loading ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="size-4" aria-hidden />
            )}
            {loading ? "Analizando" : "Analizar miniatura"}
          </Button>
          <p className="mt-3 text-xs leading-5 text-white/45">
            El primer análisis diario es gratuito. Los siguientes usan 1 crédito.
          </p>
          {error && (
            <div role="alert" className="mt-4 rounded-xl bg-red-400/[0.08] p-4">
              <p className="text-sm leading-6 text-red-200">{error}</p>
              {unauthorized && (
                <Button href="/login?next=/tools/thumbnail-analyzer" size="sm" className="mt-3">
                  Iniciar sesión
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              )}
            </div>
          )}
        </ToolResultPanel>

        <div aria-live="polite" aria-busy={loading}>
        <ToolResultPanel
          title="Lectura visual"
          description="Puntuaciones orientativas basadas en cualidades observables; no representan CTR ni resultados garantizados."
        >
          {!analysis ? (
            <div className="grid min-h-96 place-items-center rounded-xl bg-black/20 px-6 text-center text-sm leading-6 text-muted">
              {loading
                ? "Estamos revisando composición, texto, jerarquía y claridad."
                : "El análisis aparecerá aquí con observaciones específicas."}
            </div>
          ) : (
            <div className="grid gap-7">
              <div className="flex flex-col gap-5 rounded-xl bg-brand p-6 text-brand-ink sm:flex-row sm:items-center">
                <span className="text-6xl font-semibold tracking-[-0.05em]">
                  {analysis.overallScore}
                </span>
                <div>
                  <p className="text-sm font-semibold">Lectura general · /100</p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-black/70">
                    {analysis.summary}
                  </p>
                </div>
              </div>
              <div className="grid gap-px overflow-hidden rounded-xl bg-white/[0.08] sm:grid-cols-2">
                {Object.entries(analysis.categories).map(([key, category]) => (
                  <div key={key} className="bg-[#10110e] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-sm font-semibold">
                        {labels[key as keyof typeof labels]}
                      </h3>
                      <span className="text-sm font-semibold text-brand">
                        {category.score}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${category.score}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {category.feedback}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {[
                  ["Fortalezas", analysis.strengths],
                  ["A mejorar", analysis.improvements],
                  ["Siguientes pasos", analysis.suggestedActions],
                ].map(([title, items]) => (
                  <section key={title as string} className="rounded-xl bg-white/[0.035] p-5">
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted">
                      {(items as string[]).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
              {image && <ImageMetadata image={image} />}
              {cost !== null && (
                <p className="text-center text-xs text-white/45">
                  Créditos usados en este análisis: {cost}
                </p>
              )}
            </div>
          )}
        </ToolResultPanel>
        </div>
      </div>
    </div>
  );
}
