import { loadEnvConfig } from "@next/env";
import OpenAI from "openai";
import sharp from "sharp";

loadEnvConfig(process.cwd());

async function main() {
  if (!process.argv.includes("--execute")) {
    console.log("Dry run: usar --execute para realizar una llamada real de alta calidad.");
    return;
  }
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY no está configurada.");
  const model = process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2";
  const startedAt = Date.now();
  const response = await new OpenAI({ apiKey }).images.generate({
    model,
    prompt:
      "Banner panorámico original para un estudio creativo ficticio. Fondo oscuro abstracto, formas verdes geométricas, sin texto, sin logos y sin personas.",
    size: "2560x1440",
    quality: "high",
    output_format: "png",
    background: "opaque",
    moderation: "auto",
    n: 1,
  }).withResponse();
  const encoded = response.data.data?.[0]?.b64_json;
  if (!encoded) throw new Error("El proveedor respondió sin imagen.");
  const buffer = Buffer.from(encoded, "base64");
  const metadata = await sharp(buffer).metadata();
  console.log(JSON.stringify({
    model,
    requestedSize: "2560x1440",
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    bytes: buffer.length,
    durationMs: Date.now() - startedAt,
    requestIdPresent: Boolean(response.request_id),
  }, null, 2));
  if (metadata.width !== 2560 || metadata.height !== 1440) {
    process.exitCode = 2;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "image_probe_failed");
  process.exitCode = 1;
});

