import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { fetchYouTubeImage } from "@/lib/youtube/fetch-youtube-image";
import { getVideoThumbnailUrl } from "@/lib/youtube/get-video-thumbnails";
import { parseYouTubeUrl } from "@/lib/youtube/parse-youtube-url";

export const runtime = "nodejs";
const MAX_BYTES = 12 * 1024 * 1024;

function isPrivate(address: string) {
  return /^(10\.|127\.|169\.254\.|192\.168\.|0\.|::1$|fc|fd|fe80)/i.test(address) || /^172\.(1[6-9]|2\d|3[01])\./.test(address);
}

async function safeImageUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("unsafe_url");
  if (url.hostname === "localhost" || isIP(url.hostname) && isPrivate(url.hostname)) throw new Error("unsafe_url");
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((item) => isPrivate(item.address))) throw new Error("unsafe_url");
  return url;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para usar Recreate." }, { status: 401 });
  let source = "";
  try { source = String((await request.json()).url || "").trim(); } catch { /* handled below */ }
  if (!source) return NextResponse.json({ error: "Pega una URL completa." }, { status: 400 });
  try {
    let buffer: Buffer;
    let mimeType: string;
    try {
      const videoId = parseYouTubeUrl(source);
      ({ buffer, mimeType } = await fetchYouTubeImage(getVideoThumbnailUrl(videoId, "maxres"), "thumbnail"));
    } catch {
      const url = await safeImageUrl(source);
      const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10_000), headers: { Accept: "image/jpeg,image/png,image/webp" }, cache: "no-store" });
      mimeType = response.headers.get("content-type")?.split(";")[0] || "";
      if (!response.ok || response.status >= 300 && response.status < 400 || !["image/jpeg", "image/png", "image/webp"].includes(mimeType)) throw new Error("invalid_image");
      const declared = Number(response.headers.get("content-length") || 0);
      if (declared > MAX_BYTES) throw new Error("file_too_large");
      buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength > MAX_BYTES) throw new Error("file_too_large");
    }
    return new NextResponse(new Uint8Array(buffer), { headers: { "Content-Type": mimeType, "Content-Length": String(buffer.byteLength), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "No pudimos obtener esa imagen. Revisa que la URL sea pública y directa." }, { status: 422 });
  }
}
