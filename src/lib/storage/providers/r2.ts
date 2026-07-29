import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { SupabaseStorageProvider } from "@/lib/storage/providers/supabase";
import type { PrivateStorageProvider } from "@/lib/storage/storage-types";

export class R2StorageProvider implements PrivateStorageProvider {
  readonly name = "r2" as const;
  readonly bucket: string;
  private readonly client: S3Client;
  private readonly legacy = new SupabaseStorageProvider();

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID?.trim();
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
    const bucket = process.env.R2_BUCKET_NAME?.trim();
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error("[Crealy] OBJECT_STORAGE_PROVIDER=r2 requiere las credenciales privadas de R2.");
    }
    this.bucket = bucket;
    this.client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT?.trim() || `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  async head(path: string) {
    try {
      const result = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: path }));
      return { size: result.ContentLength ?? 0, contentType: result.ContentType ?? null };
    } catch {
      return null;
    }
  }
  async get(path: string) {
    try {
      const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: path }));
      return result.Body ? Buffer.from(await result.Body.transformToByteArray()) : null;
    } catch {
      return this.legacy.get(path);
    }
  }
  async put(path: string, body: Buffer, contentType: string) {
    if (await this.head(path)) return;
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: body,
      ContentType: contentType,
      CacheControl: "private, max-age=3600",
      IfNoneMatch: "*",
    }));
  }
  async remove(path: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: path }));
    // Transitional reads may still resolve from Supabase until migration is complete.
    await this.legacy.remove(path).catch(() => undefined);
  }
  async signDownload(path: string, expiresInSeconds: number) {
    if (!(await this.head(path))) return this.legacy.signDownload(path, expiresInSeconds);
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: path }), { expiresIn: expiresInSeconds });
  }
  async signUpload(path: string, contentType: string, expiresInSeconds: number) {
    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: path, ContentType: contentType, IfNoneMatch: "*" }),
      { expiresIn: expiresInSeconds },
    );
    return {
      provider: this.name,
      path,
      uploadUrl,
      headers: { "Content-Type": contentType, "If-None-Match": "*" as const },
    };
  }
}
