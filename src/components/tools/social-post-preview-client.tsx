"use client";

import {
  Bookmark,
  Clapperboard,
  Grid3X3,
  Heart,
  MessageCircle,
  Monitor,
  Moon,
  MoreHorizontal,
  Send,
  Smartphone,
  Sun,
  UserSquare2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ImageMetadata } from "@/components/tools/image-metadata";
import { ImageWarnings } from "@/components/tools/image-warnings";
import { PreviewSegmentedControl } from "@/components/tools/preview-segmented-control";
import { ToolResultPanel } from "@/components/tools/tool-result-panel";
import { ToolUploadZone } from "@/components/tools/tool-upload-zone";
import { cn } from "@/lib/utils";
import type { LocalImage } from "@/types/tools";

const platforms = {
  instagramSquare: {
    label: "Instagram · cuadrado",
    shortLabel: "Instagram 1:1",
    network: "instagram",
    ratio: 1,
    recommended: "1080 × 1080",
  },
  instagramPortrait: {
    label: "Instagram · vertical",
    shortLabel: "Instagram 4:5",
    network: "instagram",
    ratio: 4 / 5,
    recommended: "1080 × 1350",
  },
  x: {
    label: "X",
    shortLabel: "X",
    network: "generic",
    ratio: 16 / 9,
    recommended: "1600 × 900",
  },
  linkedin: {
    label: "LinkedIn",
    shortLabel: "LinkedIn",
    network: "generic",
    ratio: 1.91,
    recommended: "1200 × 627",
  },
  facebook: {
    label: "Facebook",
    shortLabel: "Facebook",
    network: "generic",
    ratio: 1.91,
    recommended: "1200 × 630",
  },
} as const;

type PlatformId = keyof typeof platforms;
type Device = "mobile" | "desktop";
type Theme = "dark" | "light";
type InstagramView = "feed" | "profile" | "reel";

const deviceOptions = [
  { value: "mobile", label: "Móvil", icon: Smartphone },
  { value: "desktop", label: "Escritorio", icon: Monitor },
] as const;

const themeOptions = [
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "light", label: "Claro", icon: Sun },
] as const;

const instagramViewOptions = [
  { value: "feed", label: "Feed", icon: UserSquare2 },
  { value: "profile", label: "Perfil", icon: Grid3X3 },
  { value: "reel", label: "Reel", icon: Clapperboard },
] as const;

const profileSamples = [
  "/images/examples/productivity.webp",
  "/images/examples/restaurant.webp",
  "/images/examples/podcast.webp",
  "/images/examples/fitness.webp",
  "/images/examples/technology.webp",
] as const;

function InstagramWordmark() {
  return (
    <span className="font-semibold tracking-[-0.04em]">
      Instagram
    </span>
  );
}

function AccountRow({ dark }: { dark: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid size-9 place-items-center rounded-full bg-[conic-gradient(#ddf527,#ff7a00,#d52cff,#ddf527)] p-[2px]">
        <span
          className={cn(
            "grid size-full place-items-center rounded-full text-xs font-bold",
            dark ? "bg-[#0f0f0f] text-white" : "bg-white text-black",
          )}
        >
          C
        </span>
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">tu_marca</p>
        <p className="text-[0.65rem] opacity-55">Ciudad de Panamá</p>
      </div>
      <MoreHorizontal className="ml-auto size-5 opacity-70" aria-hidden="true" />
    </div>
  );
}

function InstagramActions({ dark }: { dark: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 border-t px-4 py-3",
        dark ? "border-white/8" : "border-black/8",
      )}
    >
      <Heart className="size-5" aria-hidden="true" />
      <MessageCircle className="size-5" aria-hidden="true" />
      <Send className="size-5" aria-hidden="true" />
      <Bookmark className="ml-auto size-5" aria-hidden="true" />
    </div>
  );
}

function InstagramImage({
  image,
  ratio,
}: {
  image: LocalImage;
  ratio: number;
}) {
  return (
    <div className="overflow-hidden bg-black" style={{ aspectRatio: ratio }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt="Vista previa de la publicación en Instagram"
        className="size-full object-cover"
      />
    </div>
  );
}

function InstagramCanvas({
  image,
  copy,
  ratio,
  device,
  theme,
  view,
}: {
  image: LocalImage;
  copy: string;
  ratio: number;
  device: Device;
  theme: Theme;
  view: InstagramView;
}) {
  const dark = theme === "dark";
  const shell = dark ? "bg-[#0f0f0f] text-white" : "bg-white text-[#111]";
  const width = device === "mobile" ? "max-w-[390px]" : "max-w-[720px]";

  if (view === "profile") {
    return (
      <div
        className={cn(
          "mx-auto overflow-hidden rounded-2xl shadow-[0_28px_70px_rgba(0,0,0,0.3)]",
          shell,
          width,
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b px-4",
            dark ? "border-white/10" : "border-black/10",
          )}
        >
          <InstagramWordmark />
          <MoreHorizontal className="ml-auto size-5" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-[5rem_1fr] gap-5 p-5 sm:grid-cols-[7rem_1fr]">
          <span className="grid aspect-square place-items-center rounded-full bg-brand text-xl font-bold text-brand-ink">
            C
          </span>
          <div className="min-w-0">
            <p className="font-semibold">tu_marca</p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
              <span><strong className="block text-sm">24</strong>posts</span>
              <span><strong className="block text-sm">1.8k</strong>seguidores</span>
              <span><strong className="block text-sm">310</strong>seguidos</span>
            </div>
          </div>
          <p className="col-span-2 text-xs leading-5 opacity-70">
            Ideas visuales claras para una marca que quiere comunicar mejor.
          </p>
        </div>
        <div
          className={cn(
            "grid grid-cols-3 gap-[2px] border-t",
            dark ? "border-white/10" : "border-black/10",
          )}
        >
          {[image.url, ...profileSamples].slice(0, 6).map((src, index) => (
            <div key={`${src}-${index}`} className="aspect-square overflow-hidden bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === "reel") {
    return (
      <div
        className={cn(
          "relative mx-auto aspect-[9/16] max-h-[720px] min-h-[540px] overflow-hidden rounded-2xl bg-black text-white shadow-[0_28px_70px_rgba(0,0,0,0.35)]",
          device === "mobile" ? "w-full max-w-[360px]" : "w-[405px]",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt="Vista previa del Reel"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
        <div className="absolute top-0 inset-x-0 flex items-center p-4">
          <span className="font-semibold">Reels</span>
          <MoreHorizontal className="ml-auto size-5" aria-hidden="true" />
        </div>
        <div className="absolute right-4 bottom-20 grid gap-5">
          <Heart className="size-6" aria-hidden="true" />
          <MessageCircle className="size-6" aria-hidden="true" />
          <Send className="size-6" aria-hidden="true" />
          <MoreHorizontal className="size-6" aria-hidden="true" />
        </div>
        <div className="absolute right-16 bottom-5 left-4">
          <p className="text-sm font-semibold">@tu_marca</p>
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/85">
            {copy || "Escribe el texto de tu publicación."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto overflow-hidden rounded-2xl shadow-[0_28px_70px_rgba(0,0,0,0.3)]",
        shell,
        width,
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b px-4",
          dark ? "border-white/10" : "border-black/10",
        )}
      >
        <InstagramWordmark />
        <Heart className="ml-auto size-5" aria-hidden="true" />
        <Send className="ml-4 size-5" aria-hidden="true" />
      </div>
      {device === "desktop" && (
        <div className="flex gap-4 overflow-hidden px-4 py-3">
          {["Tu historia", "Ideas", "Proceso", "Nuevo"].map((item, index) => (
            <div key={item} className="w-14 shrink-0 text-center">
              <span
                className={cn(
                  "mx-auto block size-12 rounded-full border-2",
                  index === 0 ? "border-brand bg-brand/15" : "border-white/20",
                )}
              />
              <span className="mt-1 block truncate text-[0.55rem] opacity-65">
                {item}
              </span>
            </div>
          ))}
        </div>
      )}
      <article className={cn(device === "desktop" && "mx-auto max-w-lg pb-5")}>
        <AccountRow dark={dark} />
        <InstagramImage image={image} ratio={ratio} />
        <InstagramActions dark={dark} />
        <div className="px-4 pb-4 text-xs leading-5">
          <p className="font-semibold">1,248 Me gusta</p>
          <p className="mt-1">
            <strong>tu_marca</strong>{" "}
            <span className="opacity-78">
              {copy || "Escribe el texto de tu publicación."}
            </span>
          </p>
          <p className="mt-1 opacity-45">Hace unos segundos</p>
        </div>
      </article>
    </div>
  );
}

function GenericSocialCanvas({
  image,
  copy,
  platform,
  device,
}: {
  image: LocalImage;
  copy: string;
  platform: (typeof platforms)[PlatformId];
  device: Device;
}) {
  return (
    <div
      className={cn(
        "mx-auto overflow-hidden rounded-2xl bg-[#141512] text-white shadow-[0_28px_70px_rgba(0,0,0,0.28)]",
        device === "mobile" ? "max-w-[390px]" : "max-w-[680px]",
      )}
    >
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <span className="grid size-9 place-items-center rounded-full bg-brand text-xs font-bold text-brand-ink">
          C
        </span>
        <div>
          <p className="text-sm font-semibold">Tu marca</p>
          <p className="text-[0.65rem] text-white/48">Ahora · Público</p>
        </div>
        <span className="ml-auto rounded-md bg-white/[0.06] px-2 py-1 text-[0.65rem] font-semibold text-white/60">
          {platform.shortLabel}
        </span>
      </header>
      <p className="px-4 py-4 text-sm leading-6 text-white/78">
        {copy || "Escribe el texto de tu publicación."}
      </p>
      <div
        className="relative overflow-hidden bg-black"
        style={{ aspectRatio: platform.ratio }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={`Vista previa para ${platform.label}`}
          className="size-full object-cover"
        />
        <span className="absolute right-3 bottom-3 rounded-md bg-black/78 px-2.5 py-1 text-[0.65rem] font-semibold text-white">
          {platform.recommended} px
        </span>
      </div>
      <footer className="grid grid-cols-3 border-t border-white/10 px-4 py-3 text-center text-xs text-white/50">
        <span>Reaccionar</span>
        <span>Comentar</span>
        <span>Compartir</span>
      </footer>
    </div>
  );
}

export function SocialPostPreviewClient() {
  const [image, setImage] = useState<LocalImage | null>(null);
  const [platform, setPlatform] = useState<PlatformId>("instagramSquare");
  const [copy, setCopy] = useState(
    "Una idea clara merece un diseño que se entienda a primera vista.",
  );
  const [device, setDevice] = useState<Device>("mobile");
  const [theme, setTheme] = useState<Theme>("dark");
  const [instagramView, setInstagramView] =
    useState<InstagramView>("feed");

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );

  const selected = platforms[platform];
  const isInstagram = selected.network === "instagram";
  const previewImage =
    image ??
    ({
      url: "/images/examples/productivity.webp",
    } as LocalImage);
  const warnings = useMemo(() => {
    if (!image) return [];
    if (Math.abs(image.width / image.height - selected.ratio) > 0.04) {
      return [
        `La proporción no coincide con ${selected.label}; parte de la imagen se recortará.`,
      ];
    }
    return [];
  }, [image, selected]);

  return (
    <div className="grid min-w-0 gap-6">
      <ToolResultPanel
        title="Contenido de la publicación"
        description="Sube el diseño y personaliza el texto que aparecerá dentro de la simulación."
      >
        <div className="grid min-w-0 gap-6 lg:grid-cols-[320px_1fr]">
          <ToolUploadZone
            onImage={(next) => {
              if (image) URL.revokeObjectURL(image.url);
              setImage(next);
            }}
            compact
          />
          <div className="grid min-w-0 content-start gap-4 sm:grid-cols-2">
            <label className="grid min-w-0 gap-2 text-sm font-medium">
              Plataforma y formato
              <select
                value={platform}
                onChange={(event) =>
                  setPlatform(event.target.value as PlatformId)
                }
                className="h-11 min-w-0 rounded-xl bg-surface-elevated px-3 text-foreground outline-none ring-brand focus:ring-2"
              >
                {Object.entries(platforms).map(([id, item]) => (
                  <option key={id} value={id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid min-w-0 gap-2 text-sm font-medium sm:row-span-2">
              Texto de la publicación
              <textarea
                value={copy}
                maxLength={500}
                rows={5}
                onChange={(event) => setCopy(event.target.value)}
                className="min-w-0 resize-none rounded-xl bg-white/[0.055] p-3.5 text-foreground outline-none ring-brand focus:ring-2"
              />
            </label>
            <div className="rounded-xl bg-white/[0.035] px-4 py-3 text-sm text-muted">
              Medida recomendada:{" "}
              <strong className="text-foreground">{selected.recommended} px</strong>
            </div>
          </div>
        </div>
      </ToolResultPanel>

      <ToolResultPanel
        title={isInstagram ? "Simulador de Instagram" : `Preview de ${selected.label}`}
        description={
          isInstagram
            ? "Cambia entre Feed, Perfil y Reel para revisar tu diseño dentro de un contexto reconocible."
            : "Un marco neutral muestra la proporción, el recorte y la medida sin imitar una interfaz que puede cambiar."
        }
      >
        <div
          className={cn(
            "grid min-w-0 gap-4",
            isInstagram ? "md:grid-cols-3" : "md:grid-cols-2",
          )}
        >
          <PreviewSegmentedControl
            label="Dispositivo"
            value={device}
            options={deviceOptions}
            onChange={setDevice}
          />
          {isInstagram && (
            <PreviewSegmentedControl
              label="Vista"
              value={instagramView}
              options={instagramViewOptions}
              onChange={setInstagramView}
            />
          )}
          {isInstagram && (
            <PreviewSegmentedControl
              label="Tema"
              value={theme}
              options={themeOptions}
              onChange={setTheme}
            />
          )}
        </div>

        <div className="mt-6 min-w-0 overflow-x-auto rounded-2xl bg-[#090a08] p-2 sm:p-5">
          {isInstagram ? (
            <InstagramCanvas
              image={previewImage}
              copy={copy}
              ratio={selected.ratio}
              device={device}
              theme={theme}
              view={instagramView}
            />
          ) : (
            <GenericSocialCanvas
              image={previewImage}
              copy={copy}
              platform={selected}
              device={device}
            />
          )}
        </div>
        {!image && (
          <p className="mt-3 text-center text-xs text-muted">
            Mostrando una imagen de ejemplo. Sube tu diseño para revisar su recorte real.
          </p>
        )}
        <p role="status" aria-live="polite" className="mt-4 text-xs text-muted">
          Vista activa: {selected.label}, {device === "mobile" ? "móvil" : "escritorio"}
          {isInstagram
            ? `, ${instagramViewOptions.find((item) => item.value === instagramView)?.label}, tema ${theme === "dark" ? "oscuro" : "claro"}`
            : ""}.
        </p>
      </ToolResultPanel>

      {image && (
        <ToolResultPanel
          title="Diagnóstico del archivo"
          description={`Medida sugerida: ${selected.recommended} px. La interfaz final de cada red puede cambiar.`}
        >
          <div className="grid gap-5">
            <ImageMetadata image={image} />
            <ImageWarnings warnings={warnings} />
          </div>
        </ToolResultPanel>
      )}
    </div>
  );
}
