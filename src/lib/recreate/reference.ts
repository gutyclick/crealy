import type { RecreateCategory, RecreateSimilarity } from "@/types/recreate";

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeVideoId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let candidate: string | null = null;
    if (host === "youtu.be") candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
      candidate = url.pathname === "/watch"
        ? url.searchParams.get("v")
        : url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/)?.[1] ?? null;
    }
    return candidate && VIDEO_ID.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export function getYouTubeThumbnailUrl(videoId: string) {
  if (!VIDEO_ID.test(videoId)) throw new Error("invalid_youtube_video");
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

export function getSimilarityInstructions(mode: RecreateSimilarity) {
  if (mode === "inspired") return "Conserva la idea general, el patrón de lectura y la emoción; reinterpreta libremente la estructura.";
  if (mode === "very_similar") return "Conserva con fuerza la estructura relativa, jerarquía, escala y energía, pero cambia identidad, texto, objetos, marcas y detalles para obtener una obra inequívocamente original.";
  return "Mantén composición y jerarquía cercanas, adaptando los elementos principales con un equilibrio claro entre familiaridad y originalidad.";
}

export function isRecreateCategory(value: string): value is RecreateCategory {
  return ["thumbnail", "social-post", "banner", "social-cover"].includes(value);
}

