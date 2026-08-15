"use client";

import { ArrowRight, Download, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function DownloadFirstWin({ generationId }: { generationId: string }) {
  const [downloaded, setDownloaded] = useState(false);

  const record = (event: "visual_signature_invited" | "visual_signature_started") => {
    void fetch("/api/activation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, generationId }),
      keepalive: true,
    });
  };

  return (
    <>
      <a
        href={`/api/generations/${generationId}/download`}
        onClick={() => {
          setDownloaded(true);
          record("visual_signature_invited");
        }}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Download aria-hidden="true" className="size-4" />
        Descargar PNG
      </a>
      {downloaded ? (
        <div className="mt-2 rounded-xl bg-brand/[0.07] p-4 ring-1 ring-brand/20">
          <div className="flex items-start gap-3">
            <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
            <div>
              <p className="text-sm font-semibold text-foreground">Haz reconocible tu próximo diseño.</p>
              <p className="mt-1 text-xs leading-5 text-muted">Guarda colores, dirección y referencias como tu Firma Visual.</p>
              <Link href="/my-style" onClick={() => record("visual_signature_started")} className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                Crear mi Firma Visual <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
