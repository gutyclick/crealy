import "server-only";

import { DEFAULT_RESPONSES_MODEL } from "@/config/openai";
import { getOpenAIClient } from "@/lib/openai/client";
import { getPrivateStorage } from "@/lib/storage/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StyleAnalysis, StyleVisualAttributes } from "@/types/brand-style";

const KEYS: (keyof StyleVisualAttributes)[] = ["colors", "composition", "typography", "lighting", "subjects", "effects", "mood"];

function parseAnalysis(text: string): StyleAnalysis {
  const raw = JSON.parse(text) as Record<string, unknown>;
  const attrs = raw.attributes && typeof raw.attributes === "object" ? raw.attributes as Record<string, unknown> : {};
  const attributes = Object.fromEntries(KEYS.map((key) => [key, Array.isArray(attrs[key]) ? attrs[key].filter((v): v is string => typeof v === "string").slice(0, 8) : []])) as StyleVisualAttributes;
  if (typeof raw.summary !== "string") throw new Error("invalid_style_analysis");
  return { summary: raw.summary.slice(0, 600), attributes, consistencyScore: Math.max(0, Math.min(100, Number(raw.consistencyScore) || 0)), warnings: Array.isArray(raw.warnings) ? raw.warnings.filter((v): v is string => typeof v === "string").slice(0, 4) : [] };
}

export async function analyzeBrandStyle(userId: string, styleId: string): Promise<StyleAnalysis> {
  const admin = createAdminClient();
  const { data: refs } = await admin.from("brand_style_references").select("storage_path, mime_type").eq("style_id", styleId).eq("user_id", userId).order("position");
  if (!refs || refs.length < 3) throw new Error("insufficient_style_references");
  await admin.from("brand_styles").update({ analysis_status: "analyzing" }).eq("id", styleId).eq("user_id", userId);
  const images = await Promise.all(refs.map(async (ref) => { const buffer = await getPrivateStorage().get(ref.storage_path); if (!buffer) throw new Error("style_reference_not_found"); return { type: "input_image" as const, image_url: `data:${ref.mime_type};base64,${buffer.toString("base64")}`, detail: "low" as const }; }));
  try {
    const response = await getOpenAIClient().responses.create({ model: process.env.OPENAI_RESPONSES_MODEL?.trim() || DEFAULT_RESPONSES_MODEL, store: false, input: [{ role: "user", content: [{ type: "input_text", text: `Analiza estas referencias como un sistema de identidad visual reutilizable. Describe patrones, nunca contenido concreto, personas, objetos ni textos copiables. Evalúa coherencia entre referencias. Devuelve SOLO JSON válido con: summary string; attributes con arrays colors, composition, typography, lighting, subjects, effects, mood; consistencyScore entero 0-100; warnings string[]. Usa español.` }, ...images] }] });
    const result = parseAnalysis(response.output_text);
    await admin.from("brand_styles").update({ visual_summary: result.summary, description: result.summary, visual_attributes: result.attributes, consistency_score: result.consistencyScore, warnings: result.warnings, analysis_status: "ready", updated_at: new Date().toISOString() }).eq("id", styleId).eq("user_id", userId);
    return result;
  } catch (error) {
    await admin.from("brand_styles").update({ analysis_status: "failed" }).eq("id", styleId).eq("user_id", userId);
    throw error;
  }
}
