"use client";

import { Download, LoaderCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ToolResultPanel } from "@/components/tools/tool-result-panel";
import {
  YOUTUBE_THUMBNAIL_VARIANTS,
  type YouTubeThumbnailVariant,
} from "@/lib/youtube/get-video-thumbnails";
import { parseYouTubeUrl } from "@/lib/youtube/parse-youtube-url";

type Result = {
  variant: YouTubeThumbnailVariant;
  url: string;
  width: number;
  height: number;
  bytes: number;
};

const labels: Record<YouTubeThumbnailVariant, string> = {
  maxres: "Máxima resolución",
  standard: "Estándar",
  high: "Alta",
  medium: "Media",
  default: "Predeterminada",
};

export function YoutubeThumbnailDownloaderClient() {
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(
    () => () => results.forEach((result) => URL.revokeObjectURL(result.url)),
    [results],
  );

  async function resolve() {
    setError("");
    let videoId: string;
    try {
      videoId = parseYouTubeUrl(url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "URL no válida.");
      return;
    }
    results.forEach((result) => URL.revokeObjectURL(result.url));
    setResults([]);
    setLoading(true);
    try {
      const variants = Object.keys(
        YOUTUBE_THUMBNAIL_VARIANTS,
      ) as YouTubeThumbnailVariant[];
      const found = await Promise.all(
        variants.map(async (variant): Promise<Result | null> => {
          const response = await fetch(
            `/api/tools/youtube/thumbnails/${videoId}/${variant}`,
          );
          if (!response.ok) return null;
          const blob = await response.blob();
          return {
            variant,
            url: URL.createObjectURL(blob),
            width: Number(response.headers.get("x-image-width") || 0),
            height: Number(response.headers.get("x-image-height") || 0),
            bytes: blob.size,
          };
        }),
      );
      const available = found.filter((item): item is Result => Boolean(item));
      if (!available.length) {
        setError("YouTube no devolvió miniaturas disponibles para este video.");
      }
      setResults(available);
    } catch {
      setError("No pudimos consultar las miniaturas. Inténtalo otra vez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <ToolResultPanel
        title="Pega la URL del video"
        description="Compatible con enlaces watch, youtu.be, Shorts y embed."
      >
        <label
          htmlFor="youtube-video-url"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          URL del video
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="youtube-video-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            className="h-12 min-w-0 flex-1 rounded-xl bg-white/[0.055] px-4 text-sm text-foreground outline-none ring-brand placeholder:text-white/35 focus:ring-2"
          />
          <Button type="button" onClick={() => void resolve()} disabled={loading}>
            {loading ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <Search className="size-4" aria-hidden />
            )}
            {loading ? "Buscando" : "Buscar variantes"}
          </Button>
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {error}
          </p>
        )}
      </ToolResultPanel>

      <div aria-live="polite" aria-busy={loading}>
      {results.length > 0 && (
        <ToolResultPanel
          title="Variantes disponibles"
          description="Solo mostramos archivos que YouTube entregó correctamente."
        >
          <div className="grid gap-5 md:grid-cols-2">
            {results.map((result) => (
              <article
                key={result.variant}
                className="overflow-hidden rounded-xl bg-black/30"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.url}
                  alt={`${labels[result.variant]} de la miniatura`}
                  className="aspect-video w-full object-cover"
                />
                <div className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <h3 className="text-sm font-semibold">
                      {labels[result.variant]}
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      {result.width} × {result.height} px
                    </p>
                  </div>
                  <Button
                    href={result.url}
                    download={`youtube-thumbnail-${result.variant}.jpg`}
                    size="sm"
                    variant="secondary"
                  >
                    <Download className="size-4" aria-hidden />
                    Descargar
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </ToolResultPanel>
      )}
      </div>
      <p className="text-center text-xs leading-5 text-white/45">
        Descarga únicamente contenido propio o que tengas permiso para usar.
      </p>
    </div>
  );
}
