"use client";

import { Download, LoaderCircle, Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ToolResultPanel } from "@/components/tools/tool-result-panel";

type BannerResult = {
  channelId: string;
  channelTitle: string;
  downloadUrl: string;
};

export function YoutubeBannerDownloaderClient() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<BannerResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function resolve() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const response = await fetch(
        `/api/tools/youtube/banner?url=${encodeURIComponent(url)}`,
      );
      const data = (await response.json()) as BannerResult & { error?: string };
      if (!response.ok) throw new Error(data.error || "No pudimos consultar el canal.");
      setResult(data);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "No pudimos consultar el canal.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <ToolResultPanel
        title="Pega la URL del canal"
        description="Acepta canales con /channel/UC… y /@handle. La consulta usa YouTube Data API."
      >
        <label
          htmlFor="youtube-channel-url"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          URL del canal
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="youtube-channel-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.youtube.com/@tu-canal"
            className="h-12 min-w-0 flex-1 rounded-xl bg-white/[0.055] px-4 text-sm text-foreground outline-none ring-brand placeholder:text-white/35 focus:ring-2"
          />
          <Button type="button" onClick={() => void resolve()} disabled={loading}>
            {loading ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <Search className="size-4" aria-hidden />
            )}
            {loading ? "Consultando" : "Buscar banner"}
          </Button>
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {error}
          </p>
        )}
      </ToolResultPanel>

      <div aria-live="polite" aria-busy={loading}>
      {result && (
        <ToolResultPanel
          title={result.channelTitle}
          description="Banner público devuelto por la API oficial de YouTube."
        >
          <div className="overflow-hidden rounded-xl bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.downloadUrl}
              alt={`Banner de ${result.channelTitle}`}
              className="aspect-video w-full object-cover"
            />
          </div>
          <Button href={result.downloadUrl} className="mt-5">
            <Download className="size-4" aria-hidden />
            Descargar banner
          </Button>
        </ToolResultPanel>
      )}
      </div>
      <p className="text-center text-xs leading-5 text-white/45">
        Algunos canales no exponen un banner mediante la API. Respeta siempre
        los derechos del creador.
      </p>
    </div>
  );
}
