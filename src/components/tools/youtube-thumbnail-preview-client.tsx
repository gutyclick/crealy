"use client";

import {
  Clock3,
  Home,
  Menu,
  Monitor,
  Moon,
  MoreVertical,
  Play,
  Search,
  Sidebar,
  Smartphone,
  Sun,
  Tablet,
  ThumbsUp,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ImageMetadata } from "@/components/tools/image-metadata";
import { ImageWarnings } from "@/components/tools/image-warnings";
import { PreviewSegmentedControl } from "@/components/tools/preview-segmented-control";
import { ToolResultPanel } from "@/components/tools/tool-result-panel";
import { ToolUploadZone } from "@/components/tools/tool-upload-zone";
import { cn } from "@/lib/utils";
import { estimateImageContrast } from "@/lib/tools/local-image";
import type { LocalImage } from "@/types/tools";

type Device = "desktop" | "mobile" | "tablet";
type View = "home" | "search" | "sidebar";
type Theme = "dark" | "light";

const samples = [
  {
    src: "/images/examples/gaming.webp",
    title: "La idea que cambió por completo mi canal",
    channel: "Creadores al día",
    views: "84 k vistas · hace 3 días",
    duration: "10:24",
  },
  {
    src: "/images/examples/fitness.webp",
    title: "El reto que parecía imposible",
    channel: "Modo activo",
    views: "126 k vistas · hace 1 semana",
    duration: "14:08",
  },
  {
    src: "/images/examples/technology.webp",
    title: "Probé esta tecnología durante 30 días",
    channel: "Pulso digital",
    views: "51 k vistas · hace 5 días",
    duration: "8:42",
  },
  {
    src: "/images/examples/podcast.webp",
    title: "Una conversación que vale la pena escuchar",
    channel: "Punto de encuentro",
    views: "32 k vistas · hace 2 días",
    duration: "42:17",
  },
  {
    src: "/images/examples/productivity.webp",
    title: "Mi sistema para avanzar sin perder el foco",
    channel: "Mejor cada día",
    views: "97 k vistas · hace 6 días",
    duration: "11:35",
  },
] as const;

const deviceOptions = [
  { value: "desktop", label: "Escritorio", icon: Monitor },
  { value: "mobile", label: "Móvil", icon: Smartphone },
  { value: "tablet", label: "Tablet", icon: Tablet },
] as const;

const viewOptions = [
  { value: "home", label: "Inicio", icon: Home },
  { value: "search", label: "Búsqueda", icon: Search },
  { value: "sidebar", label: "Sugeridos", icon: Sidebar },
] as const;

const themeOptions = [
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "light", label: "Claro", icon: Sun },
] as const;

type VideoCardData = {
  src?: string;
  title: string;
  channel: string;
  views: string;
  duration: string;
  uploaded?: boolean;
};

function YoutubeMark() {
  return (
    <span className="flex shrink-0 items-center gap-2 font-semibold tracking-[-0.03em]">
      <span className="grid h-5 w-7 place-items-center rounded-[0.35rem] bg-[#ff0033]">
        <Play className="size-3 fill-white text-white" aria-hidden="true" />
      </span>
      <span className="hidden text-base sm:inline">YouTube</span>
    </span>
  );
}

function Thumbnail({
  video,
  onUpload,
  compact = false,
}: {
  video: VideoCardData;
  onUpload: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-lg bg-black/8",
        video.uploaded && "ring-2 ring-brand ring-offset-2 ring-offset-current",
      )}
    >
      {video.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={video.src}
          alt=""
          className="size-full object-cover"
        />
      ) : (
        <button
          type="button"
          onClick={onUpload}
          className="grid size-full place-items-center bg-[linear-gradient(135deg,rgba(221,245,39,0.14),rgba(221,245,39,0.035))] text-center text-current"
        >
          <span>
            <Upload className="mx-auto size-5 text-brand" aria-hidden="true" />
            <span className="mt-2 block text-xs font-semibold">
              Sube tu miniatura
            </span>
          </span>
        </button>
      )}
      <span
        className={cn(
          "absolute right-1.5 bottom-1.5 rounded bg-black/90 px-1.5 py-0.5 font-semibold text-white",
          compact ? "text-preview-micro" : "text-preview-small",
        )}
      >
        {video.duration}
      </span>
    </div>
  );
}

function VideoMeta({
  video,
  compact = false,
}: {
  video: VideoCardData;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      {video.uploaded && (
        <span
          className={cn(
            "mb-1 inline-flex rounded-md bg-brand font-bold text-brand-ink",
            compact ? "text-preview-tiny px-1.5 py-0.5" : "text-preview-caption px-2 py-1",
          )}
        >
          TU MINIATURA
        </span>
      )}
      <p
        className={cn(
          "line-clamp-2 font-semibold leading-snug",
          compact ? "text-xs" : "text-xs sm:text-sm",
        )}
      >
        {video.title}
      </p>
      <p
        className={cn(
          "mt-1 truncate opacity-60",
          compact ? "text-preview-caption" : "text-preview-meta sm:text-xs",
        )}
      >
        {video.channel}
      </p>
      <p
        className={cn(
          "truncate opacity-60",
          compact ? "text-preview-caption" : "text-preview-meta sm:text-xs",
        )}
      >
        {video.views}
      </p>
    </div>
  );
}

function YoutubeCanvas({
  image,
  title,
  channel,
  duration,
  device,
  view,
  theme,
  onUpload,
}: {
  image: LocalImage | null;
  title: string;
  channel: string;
  duration: string;
  device: Device;
  view: View;
  theme: Theme;
  onUpload: () => void;
}) {
  const uploaded: VideoCardData = {
    src: image?.url,
    title: title || "Tu increíble título de video",
    channel: channel || "Tu canal",
    views: "— vistas · ahora",
    duration: duration || "0:00",
    uploaded: true,
  };
  const videos: VideoCardData[] = [
    samples[0],
    uploaded,
    samples[1],
    samples[2],
    samples[3],
    samples[4],
  ];
  const dark = theme === "dark";
  const isMobile = device === "mobile";
  const isTablet = device === "tablet";

  return (
    <div
      className={cn(
        "mx-auto overflow-hidden rounded-2xl shadow-[0_28px_70px_rgba(0,0,0,0.3)] transition-[max-width,background-color,color] duration-500",
        dark ? "bg-[#0f0f0f] text-white" : "bg-white text-[#0f0f0f]",
        isMobile
          ? "max-w-[390px]"
          : isTablet
            ? "max-w-[760px]"
            : "max-w-[1080px]",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center gap-3 border-b px-3 sm:px-5",
          dark ? "border-white/10" : "border-black/10",
        )}
      >
        <Menu className="size-5 shrink-0 opacity-65" aria-hidden="true" />
        <YoutubeMark />
        {!isMobile && (
          <div
            className={cn(
              "mx-auto flex h-9 w-full max-w-md items-center justify-between rounded-full border px-4 text-xs opacity-75",
              dark ? "border-white/15 bg-black/20" : "border-black/10 bg-black/[0.025]",
            )}
          >
            Buscar
            <Search className="size-4" aria-hidden="true" />
          </div>
        )}
        {isMobile && <span className="ml-auto" />}
        <Search className="size-5 shrink-0 opacity-70" aria-hidden="true" />
        <span
          className={cn(
            "size-7 shrink-0 rounded-full",
            dark ? "bg-white/18" : "bg-black/10",
          )}
        />
      </div>

      {view === "home" && (
        <div
          className={cn(
            "grid gap-x-3 gap-y-6 p-3 sm:p-5",
            isMobile
              ? "grid-cols-1"
              : isTablet
                ? "grid-cols-2"
                : "grid-cols-3",
          )}
        >
          {videos.map((video, index) => (
            <article key={`${video.title}-${index}`} className="min-w-0">
              <Thumbnail video={video} onUpload={onUpload} />
              <div className="mt-2 grid grid-cols-[2rem_1fr_auto] gap-2">
                <span
                  className={cn(
                    "size-8 rounded-full",
                    dark ? "bg-white/14" : "bg-black/10",
                  )}
                />
                <VideoMeta video={video} />
                <MoreVertical className="size-4 opacity-50" aria-hidden="true" />
              </div>
            </article>
          ))}
        </div>
      )}

      {view === "search" && (
        <div className="grid gap-4 p-3 sm:p-5">
          {videos.slice(0, isMobile ? 4 : 5).map((video, index) => (
            <article
              key={`${video.title}-${index}`}
              className={cn(
                "grid min-w-0 gap-3",
                isMobile
                  ? "grid-cols-[42%_1fr]"
                  : "grid-cols-[minmax(190px,38%)_1fr]",
              )}
            >
              <Thumbnail video={video} onUpload={onUpload} compact={isMobile} />
              <div className="min-w-0 py-1">
                <VideoMeta video={video} compact={isMobile} />
                {!isMobile && (
                  <p className="mt-3 line-clamp-2 text-xs leading-5 opacity-55">
                    Una descripción breve del contenido ayuda a reconocer cómo
                    compite la miniatura dentro de una búsqueda.
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {view === "sidebar" && (
        <div
          className={cn(
            "grid gap-4 p-3 sm:p-5",
            isMobile || isTablet
              ? "grid-cols-1"
              : "grid-cols-[minmax(0,1fr)_340px]",
          )}
        >
          <section>
            <div
              className={cn(
                "grid aspect-video place-items-center rounded-xl",
                dark ? "bg-black" : "bg-[#e9e9e9]",
              )}
            >
              <Play className="size-12 opacity-25" aria-hidden="true" />
            </div>
            <h3 className="mt-3 text-base font-semibold">
              Video que tu audiencia está viendo
            </h3>
            <div className="mt-3 flex items-center gap-2 text-xs opacity-60">
              <ThumbsUp className="size-4" aria-hidden="true" />
              Me gusta
              <Clock3 className="ml-3 size-4" aria-hidden="true" />
              Guardar
            </div>
          </section>
          <aside className="grid content-start gap-3" aria-label="Videos sugeridos">
            {[uploaded, ...samples].slice(0, isMobile ? 4 : 5).map((video, index) => (
              <article
                key={`${video.title}-${index}`}
                className="grid min-w-0 grid-cols-[44%_1fr] gap-2"
              >
                <Thumbnail video={video} onUpload={onUpload} compact />
                <VideoMeta video={video} compact />
              </article>
            ))}
          </aside>
        </div>
      )}
    </div>
  );
}

export function YoutubeThumbnailPreviewClient() {
  const [image, setImage] = useState<LocalImage | null>(null);
  const [title, setTitle] = useState(
    "Cómo diseñar una miniatura que se entienda en segundos",
  );
  const [channel, setChannel] = useState("Tu canal");
  const [duration, setDuration] = useState("12:48");
  const [device, setDevice] = useState<Device>("desktop");
  const [view, setView] = useState<View>("home");
  const [theme, setTheme] = useState<Theme>("dark");
  const [contrast, setContrast] = useState<number | null>(null);

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );

  useEffect(() => {
    if (!image) return;
    let active = true;
    void estimateImageContrast(image.url)
      .then((value) => {
        if (active) setContrast(value);
      })
      .catch(() => {
        if (active) setContrast(null);
      });
    return () => {
      active = false;
    };
  }, [image]);

  const warnings = useMemo(() => {
    if (!image) return [];
    const next: string[] = [];
    if (Math.abs(image.width / image.height - 16 / 9) > 0.025) {
      next.push("La proporción no es 16:9; YouTube puede recortar la imagen.");
    }
    if (image.width < 1280 || image.height < 720) {
      next.push("La resolución es menor a 1280 × 720 px.");
    }
    if (image.bytes > 2 * 1024 * 1024) {
      next.push("El archivo supera 2 MB; comprímelo antes de publicarlo.");
    }
    if (contrast !== null && contrast < 2) {
      next.push(
        "El contraste global parece bajo; revisa texto y sujeto a tamaño pequeño.",
      );
    }
    return next;
  }, [contrast, image]);

  function replaceImage(next: LocalImage) {
    if (image) URL.revokeObjectURL(image.url);
    setContrast(null);
    setImage(next);
  }

  return (
    <div className="grid min-w-0 gap-6">
      <ToolResultPanel
        title="Contenido de la simulación"
        description="Personaliza la tarjeta que aparecerá dentro del layout. La imagen nunca sale de tu navegador."
      >
        <div className="grid min-w-0 gap-6 lg:grid-cols-[320px_1fr]">
          <ToolUploadZone onImage={replaceImage} compact />
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <label className="grid min-w-0 gap-2 text-sm font-medium sm:col-span-2">
              Título del video
              <input
                value={title}
                maxLength={100}
                onChange={(event) => setTitle(event.target.value)}
                className="h-11 min-w-0 rounded-xl bg-white/[0.055] px-3.5 text-foreground outline-none ring-brand focus:ring-2"
              />
            </label>
            <label className="grid min-w-0 gap-2 text-sm font-medium">
              Canal
              <input
                value={channel}
                maxLength={60}
                onChange={(event) => setChannel(event.target.value)}
                className="h-11 min-w-0 rounded-xl bg-white/[0.055] px-3.5 text-foreground outline-none ring-brand focus:ring-2"
              />
            </label>
            <label className="grid min-w-0 gap-2 text-sm font-medium">
              Duración
              <input
                value={duration}
                maxLength={8}
                inputMode="numeric"
                onChange={(event) => setDuration(event.target.value)}
                className="h-11 min-w-0 rounded-xl bg-white/[0.055] px-3.5 text-foreground outline-none ring-brand focus:ring-2"
              />
            </label>
          </div>
        </div>
      </ToolResultPanel>

      <ToolResultPanel
        title="Simulador de YouTube"
        description="Cambia el contexto para comprobar escala, jerarquía y legibilidad sin multiplicar previews."
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-3">
          <PreviewSegmentedControl
            label="Dispositivo"
            value={device}
            options={deviceOptions}
            onChange={setDevice}
          />
          <PreviewSegmentedControl
            label="Vista"
            value={view}
            options={viewOptions}
            onChange={setView}
          />
          <PreviewSegmentedControl
            label="Tema"
            value={theme}
            options={themeOptions}
            onChange={setTheme}
          />
        </div>
        <div className="mt-6 min-w-0 overflow-x-auto rounded-2xl bg-[#090a08] p-2 sm:p-5">
          <YoutubeCanvas
            image={image}
            title={title}
            channel={channel}
            duration={duration}
            device={device}
            view={view}
            theme={theme}
            onUpload={() =>
              document
                .querySelector<HTMLInputElement>('input[type="file"]')
                ?.click()
            }
          />
        </div>
        <p role="status" aria-live="polite" className="mt-4 text-xs text-muted">
          Vista activa: {viewOptions.find((item) => item.value === view)?.label},{" "}
          {deviceOptions.find((item) => item.value === device)?.label},{" "}
          tema {theme === "dark" ? "oscuro" : "claro"}.
        </p>
      </ToolResultPanel>

      {image && (
        <ToolResultPanel
          title="Diagnóstico del archivo"
          description="Comprobaciones técnicas que complementan la simulación visual."
        >
          <div className="grid gap-5">
            <ImageMetadata image={image} />
            {contrast !== null && (
              <p className="rounded-xl bg-white/[0.035] px-4 py-3 text-sm text-muted">
                Contraste visual aproximado:{" "}
                <strong className="text-foreground">
                  {contrast.toFixed(1)}:1
                </strong>
                . Es una lectura global, no una medición WCAG del texto.
              </p>
            )}
            <ImageWarnings warnings={warnings} />
          </div>
        </ToolResultPanel>
      )}
    </div>
  );
}
