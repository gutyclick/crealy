import { lookup } from "node:dns/promises";

import { NextResponse } from "next/server";
import { Agent, fetch as pinnedFetch } from "undici";

import { isPrivateAddress } from "@/lib/http/private-address";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/operations/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { fetchYouTubeImage } from "@/lib/youtube/fetch-youtube-image";
import { getVideoThumbnailUrl } from "@/lib/youtube/get-video-thumbnails";
import { parseYouTubeUrl } from "@/lib/youtube/parse-youtube-url";

export const runtime = "nodejs";
const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function safeImageTarget(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("unsafe_url");
  if (url.hostname === "localhost") throw new Error("unsafe_url");
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((item) => isPrivateAddress(item.address))) throw new Error("unsafe_url");
  return { url, target: addresses[0] };
}

async function downloadPinnedImage(url: URL, target: { address: string; family: number }) {
  const dispatcher = new Agent({
    connect: {
      lookup: (_hostname, options, callback) => {
        if (typeof options === "object" && options.all) callback(null, [target]);
        else callback(null, target.address, target.family);
      },
    },
  });
  try {
    const response = await pinnedFetch(url, {
      dispatcher,
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "image/jpeg,image/png,image/webp" },
    });
    const mimeType = response.headers.get("content-type")?.split(";")[0] || "";
    if (!response.ok || response.status >= 300 && response.status < 400 || !ALLOWED_MIME_TYPES.has(mimeType) || !response.body) {
      throw new Error("invalid_image");
    }
    const declared = Number(response.headers.get("content-length") || 0);
    if (declared > MAX_BYTES) throw new Error("file_too_large");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        throw new Error("file_too_large");
      }
      chunks.push(value);
    }
    return { buffer: Buffer.concat(chunks), mimeType };
  } finally {
    await dispatcher.close();
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para usar Recreate." }, { status: 401 });
  try {
    const limited = await enforceRateLimit({ request, userId: user.id, action: "recreate.reference", userPolicy: RATE_LIMITS.uploadUser, ipPolicy: RATE_LIMITS.uploadIp });
    if (!limited.allowed) return NextResponse.json({ error: "Demasiadas referencias. Espera un momento." }, { status: 429, headers: { "Retry-After": String(limited.retryAfter) } });
  } catch {
    return NextResponse.json({ error: "No pudimos validar la solicitud." }, { status: 503 });
  }
  let source = "";
  try { source = String((await request.json()).url || "").trim(); } catch { /* handled below */ }
  if (!source) return NextResponse.json({ error: "Pega una URL completa." }, { status: 400 });
  try {
    let image: { buffer: Buffer; mimeType: string };
    try {
      const videoId = parseYouTubeUrl(source);
      image = await fetchYouTubeImage(getVideoThumbnailUrl(videoId, "maxres"), "thumbnail");
    } catch {
      const target = await safeImageTarget(source);
      image = await downloadPinnedImage(target.url, target.target);
    }
    return new NextResponse(new Uint8Array(image.buffer), { headers: { "Content-Type": image.mimeType, "Content-Length": String(image.buffer.byteLength), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "No pudimos obtener esa imagen. Revisa que la URL sea pública, directa y use HTTPS." }, { status: 422 });
  }
}
