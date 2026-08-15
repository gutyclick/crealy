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
  const normalized = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = normalized.indexOf("{");
  const end = normalized.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("invalid_recreate_analysis");
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(normalized.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    throw new Error("invalid_recreate_analysis");
  }
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

export function buildFallbackBlueprint(category: RecreateCategory): RecreateBlueprint {
  return {
    category,
    composition: "Usa la primera imagen adjunta para extraer su distribución relativa, balance y patrón de lectura.",
    hierarchy: "Conserva la jerarquía abstracta de la referencia con un foco dominante y lectura inmediata.",
    visualStyle: "Reinterpreta la dirección visual de la referencia sin copiar contenido identificable.",
    background: "Adapta la profundidad, separación y energía del fondo al nuevo contenido.",
    emotion: "Mantén la emoción dominante y el nivel de contraste de la referencia.",
    textDensity: "Equivalente a la referencia, usando únicamente el texto nuevo del usuario.",
    subjectScale: "Equivalente a la referencia, usando únicamente sujetos propios del usuario.",
    colorPalette: [],
    focalElements: ["composición", "jerarquía", "contraste", "patrón de lectura"],
    replaceableElements: ["texto", "personas", "logos", "marcas", "objetos identificables"],
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
      { type: "input_text", text: [
        `Analiza esta pieza de ${category} como un plano de composición que será reconstruido con contenido nuevo.`,
        "No transcribas nombres, marcas ni el texto literal.",
        "En composition especifica con precisión: número de zonas, posición relativa en porcentajes aproximados, escala, recorte, pose o ángulo, dirección de mirada, solapamientos, espacio negativo y recorrido de lectura.",
        "En hierarchy enumera el orden exacto de atención y la relación entre sujeto, texto, producto y fondo.",
        "En background describe profundidad, perspectiva, textura y función; no inventes objetos que no tengan una función compositiva.",
        "En textDensity describe cantidad de líneas, longitud aproximada, alineación y zona ocupada, sin copiar las palabras.",
        "En subjectScale indica tamaño relativo, ubicación y recorte de cada espacio destinado a persona, personaje, producto u objeto.",
        "Devuelve SOLO JSON válido en español con: composition, hierarchy, visualStyle, background, emotion, textDensity, subjectScale (strings); colorPalette, focalElements, replaceableElements (string[]).",
        "En replaceableElements incluye texto, personas, personajes, logos, marcas y objetos identificables.",
      ].join("\n") },
      { type: "input_image", image_url: `data:${upload.mime_type};base64,${buffer.toString("base64")}`, detail: "high" },
    ] }],
  });
  return parseBlueprint(response.output_text, category);
}
