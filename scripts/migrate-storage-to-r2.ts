import { createHash } from "node:crypto";

import { loadEnvConfig } from "@next/env";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/types/database";

loadEnvConfig(process.cwd());

const execute = !process.argv.includes("--dry-run") && process.argv.includes("--execute");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) throw new Error("Faltan las credenciales privadas de Supabase.");

const admin = createClient<Database>(url, key, { auth: { persistSession: false } });
const sourceBucket = process.env.STORAGE_BUCKET?.trim() || "generations";

async function readSupabaseObject(path: string) {
  const { data, error } = await admin.storage.from(sourceBucket).download(path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

function createR2() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Faltan las credenciales privadas de R2.");
  }
  return {
    bucket,
    client: new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT?.trim() || `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

type Candidate = {
  table: "generations" | "edit_versions" | "user_uploads";
  id: string;
  userId: string;
  storagePath: string;
  mimeType: string;
  kind: "generated_original" | "edited_original" | "user_upload";
};

async function inventory(): Promise<Candidate[]> {
  const [generations, versions, uploads] = await Promise.all([
    admin.from("generations").select("id, user_id, storage_path, mime_type, asset_id").is("asset_id", null).not("storage_path", "is", null),
    admin.from("edit_versions").select("id, user_id, storage_path, mime_type, asset_id").is("asset_id", null).not("storage_path", "is", null),
    admin.from("user_uploads").select("id, user_id, storage_path, mime_type, asset_id").is("asset_id", null),
  ]);
  for (const result of [generations, versions, uploads]) if (result.error) throw result.error;
  return [
    ...(generations.data ?? []).map((row) => ({ table: "generations" as const, id: row.id, userId: row.user_id, storagePath: row.storage_path!, mimeType: row.mime_type || "image/png", kind: "generated_original" as const })),
    ...(versions.data ?? []).map((row) => ({ table: "edit_versions" as const, id: row.id, userId: row.user_id, storagePath: row.storage_path!, mimeType: row.mime_type || "image/png", kind: "edited_original" as const })),
    ...(uploads.data ?? []).map((row) => ({ table: "user_uploads" as const, id: row.id, userId: row.user_id, storagePath: row.storage_path, mimeType: row.mime_type, kind: "user_upload" as const })),
  ];
}

async function main() {
  const candidates = await inventory();
  console.log(JSON.stringify({ mode: execute ? "execute" : "dry-run", files: candidates.length }, null, 2));
  if (!execute) {
    for (const item of candidates.slice(0, 50)) console.log(`${item.table}\t${item.storagePath}`);
    return;
  }
  const target = createR2();
  let copied = 0;
  for (const item of candidates) {
    const buffer = await readSupabaseObject(item.storagePath);
    if (!buffer) throw new Error(`No existe el origen: ${item.storagePath}`);
    const sourceHash = createHash("sha256").update(buffer).digest("hex");
    await target.client.send(new PutObjectCommand({
      Bucket: target.bucket,
      Key: item.storagePath,
      Body: buffer,
      ContentType: item.mimeType,
      IfNoneMatch: "*",
    }));
    const copiedObject = await target.client.send(new GetObjectCommand({
      Bucket: target.bucket,
      Key: item.storagePath,
    }));
    const copiedBuffer = copiedObject.Body
      ? Buffer.from(await copiedObject.Body.transformToByteArray())
      : null;
    if (!copiedBuffer || copiedBuffer.length !== buffer.length) throw new Error(`Tamaño incorrecto: ${item.storagePath}`);
    const copiedHash = createHash("sha256").update(copiedBuffer).digest("hex");
    if (sourceHash !== copiedHash) throw new Error(`Hash incorrecto: ${item.storagePath}`);
    const { data: asset, error } = await admin.from("assets").insert({
      user_id: item.userId,
      kind: item.kind,
      storage_provider: "r2",
      bucket: target.bucket,
      storage_key: item.storagePath,
      mime_type: item.mimeType,
      file_size_bytes: buffer.length,
      content_sha256: sourceHash,
      status: "active",
    }).select("id").single();
    if (error) throw error;
    const { error: linkError } = await admin.from(item.table).update({ asset_id: asset.id }).eq("id", item.id).eq("user_id", item.userId);
    if (linkError) throw linkError;
    copied += 1;
  }
  console.log(JSON.stringify({ copied, sourceDeleted: 0 }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "storage_migration_failed");
  process.exitCode = 1;
});
