import "server-only";

import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";

import { getBrandStyleEntitlement, BRAND_STYLE_MAX_FILE_BYTES, BRAND_STYLE_NAME_MAX_LENGTH } from "@/config/brand-styles";
import { getUserBillingState } from "@/lib/billing/get-user-billing-state";
import { getPrivateStorage } from "@/lib/storage/provider";
import { brandStyleReferencePath } from "@/lib/storage/storage-paths";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BrandStyle, StyleVisualAttributes } from "@/types/brand-style";
import type { ContentType } from "@/types/generation";
import { ownsBrandStyle } from "@/lib/brand-styles/policy";

type StyleRow = {
  id: string; user_id: string; name: string; description: string | null; visual_summary: string | null;
  visual_attributes: unknown; consistency_score: number | null; warnings: unknown;
  supported_design_types: string[]; analysis_status: string; created_at: string; updated_at: string;
};

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 12) : [];
}

export function parseVisualAttributes(value: unknown): StyleVisualAttributes | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  return { colors: stringArray(data.colors), composition: stringArray(data.composition), typography: stringArray(data.typography), lighting: stringArray(data.lighting), subjects: stringArray(data.subjects), effects: stringArray(data.effects), mood: stringArray(data.mood) };
}

export async function getBrandStyleAccess(userId: string) {
  const billing = await getUserBillingState(userId);
  return { plan: billing.effectivePlan.key, entitlement: getBrandStyleEntitlement(billing.effectivePlan.key) };
}

export function sanitizeStyleName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return name && name.length <= BRAND_STYLE_NAME_MAX_LENGTH ? name : null;
}

export async function mapBrandStyle(row: StyleRow): Promise<BrandStyle> {
  const admin = createAdminClient();
  const { data: references } = await admin.from("brand_style_references").select("id, style_id, storage_path, position, width, height, created_at").eq("style_id", row.id).eq("user_id", row.user_id).order("position");
  const referenceImages = await Promise.all((references ?? []).map(async (reference) => ({
    id: reference.id, styleId: reference.style_id,
    imageUrl: await getPrivateStorage().signDownload(reference.storage_path, 900),
    position: reference.position, width: reference.width, height: reference.height, createdAt: reference.created_at,
  })));
  return {
    id: row.id, userId: row.user_id, name: row.name, description: row.description,
    visualSummary: row.visual_summary, visualAttributes: parseVisualAttributes(row.visual_attributes),
    consistencyScore: row.consistency_score, warnings: stringArray(row.warnings), referenceImages,
    supportedDesignTypes: row.supported_design_types as ContentType[],
    analysisStatus: row.analysis_status as BrandStyle["analysisStatus"], createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export async function listBrandStyles(userId: string) {
  const { data, error } = await createAdminClient().from("brand_styles").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
  if (error) throw error;
  return Promise.all((data ?? []).map((row) => mapBrandStyle(row)));
}

export async function requireOwnedStyle(userId: string, styleId: string) {
  const { data } = await createAdminClient().from("brand_styles").select("*").eq("id", styleId).eq("user_id", userId).maybeSingle();
  if (!data) throw new Error("style_not_found");
  if (!ownsBrandStyle(userId, data)) throw new Error("style_not_found");
  return data;
}

export async function addBrandStyleReference(userId: string, styleId: string, uploadId: string) {
  const style = await requireOwnedStyle(userId, styleId);
  const { entitlement } = await getBrandStyleAccess(userId);
  if (!entitlement.enabled) throw new Error("style_upgrade_required");
  if (!entitlement.supportedDesignTypes.some((type) => style.supported_design_types.includes(type))) throw new Error("style_not_allowed");
  const admin = createAdminClient();
  const { data: upload } = await admin.from("user_uploads").select("id, asset_id, storage_path, original_filename, mime_type, file_size").eq("id", uploadId).eq("user_id", userId).eq("purpose", "reference").maybeSingle();
  if (!upload || !['image/jpeg','image/png','image/webp'].includes(upload.mime_type) || upload.file_size <= 0 || upload.file_size > BRAND_STYLE_MAX_FILE_BYTES) throw new Error("invalid_style_reference");
  const { count } = await admin.from("brand_style_references").select("id", { count: "exact", head: true }).eq("style_id", styleId).eq("user_id", userId);
  if ((count ?? 0) >= entitlement.maxReferences) throw new Error("style_reference_limit");
  const input = await getPrivateStorage().get(upload.storage_path); if (!input) throw new Error("invalid_style_reference");
  const optimized = await sharp(input, { failOn: "error" }).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer({ resolveWithObject: true });
  const hash = createHash("sha256").update(optimized.data).digest("hex");
  const referenceId = randomUUID();
  const storagePath = brandStyleReferencePath({ userId, styleId, referenceId });
  await getPrivateStorage().put(storagePath, optimized.data, "image/webp");
  const { data, error } = await admin.from("brand_style_references").insert({ id: referenceId, style_id: styleId, user_id: userId, storage_path: storagePath, original_filename: upload.original_filename.slice(0, 180) || "referencia.webp", mime_type: "image/webp", file_size: optimized.data.length, width: optimized.info.width, height: optimized.info.height, content_hash: hash, position: (count ?? 0) + 1 }).select().single();
  if (error) { await getPrivateStorage().remove(storagePath); throw error.code === "23505" ? new Error("duplicate_style_reference") : error; }
  await admin.from("user_uploads").delete().eq("id", upload.id).eq("user_id", userId);
  if (upload.asset_id) await admin.from("assets").update({ status: "deleted", deleted_at: new Date().toISOString() }).eq("id", upload.asset_id).eq("user_id", userId);
  await getPrivateStorage().remove(upload.storage_path).catch(() => undefined);
  return data;
}

export async function deleteStyleAndStorage(userId: string, styleId: string) {
  await requireOwnedStyle(userId, styleId);
  const admin = createAdminClient();
  const { data: refs } = await admin.from("brand_style_references").select("storage_path").eq("style_id", styleId).eq("user_id", userId);
  const { error } = await admin.from("brand_styles").delete().eq("id", styleId).eq("user_id", userId);
  if (error) throw error;
  await Promise.allSettled((refs ?? []).map((ref) => getPrivateStorage().remove(ref.storage_path)));
}
