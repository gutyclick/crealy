"use client";

import {
  Monitor,
  Moon,
  Search,
  Smartphone,
  Sun,
  Tablet,
  Tv,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ImageMetadata } from "@/components/tools/image-metadata";
import { ImageWarnings } from "@/components/tools/image-warnings";
import { PreviewSegmentedControl } from "@/components/tools/preview-segmented-control";
import { ToolResultPanel } from "@/components/tools/tool-result-panel";
import { ToolUploadZone } from "@/components/tools/tool-upload-zone";
import { cn } from "@/lib/utils";
import type { LocalImage } from "@/types/tools";

type BannerDevice = "tv" | "desktop" | "tablet" | "mobile";
type PreviewTheme = "dark" | "light";

const devices = {
  tv: {
    label: "TV",
    icon: Tv,
    frame: "max-w-[980px]",
    bannerRatio: "16 / 9",
    cropLabel: "Lienzo completo · 2560 × 1440",
  },
  desktop: {
    label: "Desktop",
    icon: Monitor,
    frame: "max-w-[1080px]",
    bannerRatio: "6 / 1",
    cropLabel: "Recorte panorámico de escritorio",
  },
  tablet: {
    label: "Tablet",
    icon: Tablet,
    frame: "max-w-[760px]",
    bannerRatio: "4 / 1",
    cropLabel: "Recorte centrado para tablet",
  },
  mobile: {
    label: "Mobile",
    icon: Smartphone,
    frame: "max-w-[420px]",
    bannerRatio: "3 / 1",
    cropLabel: "Recorte centrado para móvil",
  },
} satisfies Record<
  BannerDevice,
  {
    label: string;
    icon: typeof Tv;
    frame: string;
    bannerRatio: string;
    cropLabel: string;
  }
>;

const sampleVideos = [
  {
    image: "/images/examples/podcast.webp",
    title: "Cómo convertir una idea en contenido",
    meta: "12 k vistas · hace 2 días",
  },
  {
    image: "/images/examples/technology.webp",
    title: "El sistema creativo que uso cada semana",
    meta: "8,4 k vistas · hace 5 días",
  },
  {
    image: "/images/examples/productivity.webp",
    title: "De cero a una marca que la gente recuerda",
    meta: "24 k vistas · hace 1 semana",
  },
] as const;

export function YoutubeBannerPreviewClient() {
  const [image, setImage] = useState<LocalImage | null>(null);
  const [device, setDevice] = useState<BannerDevice>("desktop");
  const [theme, setTheme] = useState<PreviewTheme>("dark");
  const [guides, setGuides] = useState(true);
  const [channelName, setChannelName] = useState("Tu canal creativo");
  const imageRef = useRef<LocalImage | null>(null);

  useEffect(
    () => () => {
      if (imageRef.current) URL.revokeObjectURL(imageRef.current.url);
    },
    [],
  );

  const warnings = useMemo(() => {
    if (!image) return [];
    const next: string[] = [];
    if (Math.abs(image.width / image.height - 16 / 9) > 0.025) {
      next.push("La proporción ideal del archivo base es 16:9.");
    }
    if (image.width < 2560 || image.height < 1440) {
      next.push("Para mayor nitidez, prepara el banner en 2560 × 1440 px.");
    }
    if (image.bytes > 6 * 1024 * 1024) {
      next.push("El archivo supera los 6 MB recomendados por YouTube.");
    }
    return next;
  }, [image]);

  const activeDevice = devices[device];
  const isDark = theme === "dark";

  const receiveImage = (next: LocalImage) => {
    if (imageRef.current) URL.revokeObjectURL(imageRef.current.url);
    imageRef.current = next;
    setImage(next);
  };

  return (
    <div className="grid gap-6">
      <ToolResultPanel
        title="Personaliza tu canal"
        description="Comprueba el banner dentro de una página realista de YouTube antes de publicarlo."
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ToolUploadZone onImage={receiveImage} compact />
          <div className="grid content-start gap-4 rounded-2xl border border-white/8 bg-white/[0.035] p-5">
            <label className="grid gap-2 text-sm font-semibold" htmlFor="channel-name">
              Nombre del canal
              <input
                id="channel-name"
                value={channelName}
                maxLength={48}
                onChange={(event) => setChannelName(event.target.value)}
                className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-medium text-foreground outline-none transition focus:border-brand/70 focus:ring-2 focus:ring-brand/15"
              />
            </label>
            <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 text-sm font-medium">
              Mostrar área segura
              <input
                type="checkbox"
                checked={guides}
                onChange={(event) => setGuides(event.target.checked)}
                className="size-4 accent-[var(--brand)]"
              />
            </label>
            <p className="text-xs leading-5 text-muted">
              Coloca texto y logotipos dentro de 1546 × 423 px para conservarlos en todos
              los dispositivos.
            </p>
          </div>
        </div>
      </ToolResultPanel>

      <ToolResultPanel
        title="Vista previa del canal"
        description="Cambia de dispositivo para comprobar cómo se adapta el recorte central."
      >
        <div className="grid gap-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <PreviewSegmentedControl
              label="Dispositivo"
              value={device}
              onChange={setDevice}
              options={(Object.entries(devices) as [BannerDevice, (typeof devices)[BannerDevice]][]).map(
                ([value, item]) => ({
                  value,
                  label: item.label,
                  icon: item.icon,
                }),
              )}
            />
            <PreviewSegmentedControl
              label="Tema"
              value={theme}
              onChange={setTheme}
              options={[
                { value: "dark", label: "Oscuro", icon: Moon },
                { value: "light", label: "Claro", icon: Sun },
              ]}
            />
          </div>

          <p className="sr-only" aria-live="polite">
            Vista {activeDevice.label}, tema {theme === "dark" ? "oscuro" : "claro"}.
          </p>

          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-black/25 p-3 sm:p-5">
            <div
              className={cn(
                "mx-auto min-w-[300px] overflow-hidden rounded-2xl border shadow-2xl transition-[max-width,background-color,color] duration-500",
                activeDevice.frame,
                isDark
                  ? "border-white/12 bg-[#0f0f0f] text-white"
                  : "border-black/15 bg-white text-[#0f0f0f]",
              )}
            >
              <div
                className={cn(
                  "flex min-h-14 items-center gap-3 border-b px-4",
                  isDark ? "border-white/10" : "border-black/10",
                )}
              >
                <div className="flex shrink-0 items-center gap-2 font-bold">
                  <span className="grid size-7 place-items-center rounded-lg bg-[#ff0033]">
                    <span className="ml-0.5 block h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-white" />
                  </span>
                  <span className={cn(device === "mobile" && "sr-only")}>YouTube</span>
                </div>
                <div
                  className={cn(
                    "mx-auto flex h-9 w-full max-w-md items-center justify-between rounded-full border px-4 text-xs",
                    isDark
                      ? "border-white/15 bg-white/[0.04] text-white/55"
                      : "border-black/15 bg-black/[0.025] text-black/50",
                  )}
                >
                  <span>Buscar</span>
                  <Search className="size-4" aria-hidden="true" />
                </div>
                <span
                  className={cn(
                    "size-8 shrink-0 rounded-full",
                    isDark ? "bg-white/15" : "bg-black/10",
                  )}
                />
              </div>

              <div
                className="relative w-full overflow-hidden bg-[#1b1b1b] transition-[aspect-ratio] duration-500"
                style={{ aspectRatio: activeDevice.bannerRatio }}
              >
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.url}
                    alt={`Banner de ${channelName || "tu canal"}`}
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      document.querySelector<HTMLInputElement>('input[type="file"]')?.click()
                    }
                    className="absolute inset-0 grid place-items-center bg-white/[0.04] text-center transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                  >
                    <span className="grid justify-items-center gap-2 px-5 text-sm font-semibold text-white">
                      <Upload className="size-5 text-brand" aria-hidden="true" />
                      Sube un banner para verlo aquí
                    </span>
                  </button>
                )}

                {guides && (
                  <div className="pointer-events-none absolute inset-y-[35.3%] inset-x-[19.8%] border border-dashed border-brand bg-black/15">
                    <span className="absolute top-1 left-1 rounded-md bg-black/75 px-2 py-1 text-[0.6rem] font-bold tracking-wide text-brand uppercase">
                      Área segura · 1546 × 423
                    </span>
                  </div>
                )}

                <span className="absolute right-2 bottom-2 rounded-md bg-black/75 px-2 py-1 text-[0.6rem] font-semibold text-white">
                  {activeDevice.cropLabel}
                </span>
              </div>

              {device !== "tv" && (
                <>
                  <div
                    className={cn(
                      "flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6",
                      isDark ? "border-white/10" : "border-black/10",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-brand text-lg font-black text-black">
                        {(channelName.trim()[0] || "C").toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold">
                          {channelName.trim() || "Tu canal creativo"}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-xs",
                            isDark ? "text-white/55" : "text-black/55",
                          )}
                        >
                          @tucanal · 12,4 k suscriptores
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={cn(
                        "min-h-10 rounded-full px-5 text-sm font-bold",
                        isDark ? "bg-white text-black" : "bg-black text-white",
                      )}
                    >
                      Suscribirse
                    </button>
                  </div>

                  <div
                    className={cn(
                      "flex gap-5 overflow-x-auto border-b px-4 text-xs font-semibold sm:px-6",
                      isDark ? "border-white/10 text-white/65" : "border-black/10 text-black/60",
                    )}
                  >
                    {["Inicio", "Videos", "Shorts", "Listas", "Comunidad"].map((tab, index) => (
                      <span
                        key={tab}
                        className={cn(
                          "shrink-0 border-b-2 px-1 py-3",
                          index === 0
                            ? isDark
                              ? "border-white text-white"
                              : "border-black text-black"
                            : "border-transparent",
                        )}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>

                  <div
                    className={cn(
                      "grid gap-3 p-4 sm:grid-cols-3 sm:p-6",
                      device === "mobile" && "grid-cols-1 sm:grid-cols-1",
                    )}
                  >
                    {sampleVideos.map((video) => (
                      <div key={video.image} className="min-w-0">
                        <div className="aspect-video overflow-hidden rounded-lg bg-black/15">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={video.image}
                            alt=""
                            className="size-full object-cover"
                          />
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs font-semibold leading-4">
                          {video.title}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-[0.65rem]",
                            isDark ? "text-white/50" : "text-black/50",
                          )}
                        >
                          {video.meta}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {image ? (
            <div className="grid gap-4 border-t border-white/8 pt-5">
              <ImageMetadata image={image} />
              <ImageWarnings warnings={warnings} />
            </div>
          ) : (
            <p className="text-center text-sm text-muted">
              El layout ya es interactivo. Sube tu imagen para probar sus recortes reales.
            </p>
          )}
        </div>
      </ToolResultPanel>
    </div>
  );
}
