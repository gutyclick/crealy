import "server-only";

import { DEFAULT_RESPONSES_MODEL } from "@/config/openai";
import { getOpenAIClient } from "@/lib/openai/client";
import { getPrivateStorage } from "@/lib/storage/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RecreateBlueprint, RecreateCategory } from "@/types/recreate";

function strings(value: unknown, limit = 8) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, limit) : [];
}

function parseBlueprint(text: string, category: RecreateCategory): RecreateBlueprint {
  const raw = JSON.parse(text) as Record<string, unknown>;
  const value = (key: string, fallback: string) => typeof raw[key] === "string" ? String(raw[key]).slice(0, 500) : fallback;
  return {
    category,
    composition: value("composition", "Composición equilibrada con un foco dominante."),
    hierarchy: value("hierarchy", "Un foco principal y lectura secundaria clara."),
    visualStyle: value("visualStyle", "Dirección visual contemporánea de alto contraste."),
    background: value("background", "Fondo que separa con claridad el sujeto."),
    emotion: value("emotion", "Claridad, curiosidad y energía."),
    textDensity: value("textDensity", "Baja"),
    subjectScale: value("subjectScale", "Dominante"),
    colorPalette: strings(raw.colorPalette, 5),
    focalElements: strings(raw.focalElements),
    replaceableElements: strings(raw.replaceableElements),
  };
}

export async function analyzeReferenceDesign(userId: string, uploadId: string, category: RecreateCategory) {
  const admin = createAdminClient();
  const { data: upload } = await admin.from("user_uploads").select("storage_path, mime_type").eq("id", uploadId).eq("user_id", userId).eq("purpose", "reference").maybeSingle();
  if (!upload || !["image/jpeg", "image/png", "image/webp"].includes(upload.mime_type)) throw new Error("invalid_reference");
  const buffer = await getPrivateStorage().get(upload.storage_path);
  if (!buffer) throw new Error("reference_not_found");
  const response = await getOpenAIClient().responses.create({
    model: process.env.OPENAI_RESPONSES_MODEL?.trim() || DEFAULT_RESPONSES_MODEL,
    store: false,
    input: [{ role: "user", content: [
      { type: "input_text", text: `Analiza esta pieza de ${category} y extrae únicamente su fórmula visual abstracta. No transcribas nombres, marcas ni texto. Devuelve SOLO JSON válido en español con: composition, hierarchy, visualStyle, background, emotion, textDensity, subjectScale (strings); colorPalette, focalElements, replaceableElements (string[]). En replaceableElements incluye texto, personas, logos, marcas y objetos identificables.` },
      { type: "input_image", image_url: `data:${upload.mime_type};base64,${buffer.toString("base64")}`, detail: "low" },
    ] }],
  });
  return parseBlueprint(response.output_text, category);
}

