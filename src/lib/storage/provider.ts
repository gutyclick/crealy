import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_BUCKET = "generations";

export type SignedUploadIntent =
  | { provider: "supabase"; path: string; token: string }
  | {
      provider: "r2";
      path: string;
      uploadUrl: string;
      headers: { "Content-Type": string };
    };

export interface PrivateStorageProvider {
  readonly name: "supabase" | "r2";
  get(path: string): Promise<Buffer | null>;
  put(path: string, body: Buffer, contentType: string): Promise<void>;
  remove(path: string): Promise<void>;
  signDownload(path: string, expiresInSeconds: number): Promise<string | null>;
  signUpload(
    path: string,
    contentType: string,
    expiresInSeconds: number,
  ): Promise<SignedUploadIntent>;
}

class SupabaseStorageProvider implements PrivateStorageProvider {
  readonly name = "supabase" as const;
  private readonly bucket = process.env.STORAGE_BUCKET?.trim() || DEFAULT_BUCKET;

  async get(path: string) {
    const { data } = await createAdminClient().storage
      .from(this.bucket)
      .download(path);
    return data ? Buffer.from(await data.arrayBuffer()) : null;
  }

  async put(path: string, body: Buffer, contentType: string) {
    const { error } = await createAdminClient().storage
      .from(this.bucket)
      .upload(path, body, {
        contentType,
        cacheControl: "3600",
        upsert: false,
      });
    if (error && !error.message.toLowerCase().includes("exist")) throw error;
  }

  async remove(path: string) {
    const { error } = await createAdminClient().storage
      .from(this.bucket)
      .remove([path]);
    if (error) throw error;
  }

  async signDownload(path: string, expiresInSeconds: number) {
    const { data } = await createAdminClient().storage
      .from(this.bucket)
      .createSignedUrl(path, expiresInSeconds);
    return data?.signedUrl ?? null;
  }

  async signUpload(path: string) {
    const { data, error } = await createAdminClient().storage
      .from(this.bucket)
      .createSignedUploadUrl(path, { upsert: false });
    if (error || !data?.token) throw error || new Error("missing_upload_token");
    return { provider: this.name, path, token: data.token };
  }
}

class R2StorageProvider implements PrivateStorageProvider {
  readonly name = "r2" as const;
  private readonly bucket: string;
  private readonly client: S3Client;
  private readonly legacy = new SupabaseStorageProvider();

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID?.trim();
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
    const bucket = process.env.R2_BUCKET_NAME?.trim();
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        "[Crealy] STORAGE_PROVIDER=r2 requiere R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY y R2_BUCKET_NAME.",
      );
    }
    this.bucket = bucket;
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async get(path: string) {
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: path }),
      );
      return result.Body
        ? Buffer.from(await result.Body.transformToByteArray())
        : null;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "$metadata" in error &&
        (error as { $metadata?: { httpStatusCode?: number } }).$metadata
          ?.httpStatusCode === 404
      ) {
        return this.legacy.get(path);
      }
      throw error;
    }
  }

  async put(path: string, body: Buffer, contentType: string) {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: path }),
      );
      return;
    } catch {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: path,
          Body: body,
          ContentType: contentType,
          CacheControl: "private, max-age=3600",
        }),
      );
    }
  }

  async remove(path: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: path }),
    );
    // During a provider migration, old objects may still live in Supabase.
    await this.legacy.remove(path).catch(() => undefined);
  }

  async signDownload(path: string, expiresInSeconds: number) {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: path }),
      );
      return getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.bucket, Key: path }),
        { expiresIn: expiresInSeconds },
      );
    } catch {
      return this.legacy.signDownload(path, expiresInSeconds);
    }
  }

  async signUpload(
    path: string,
    contentType: string,
    expiresInSeconds: number,
  ) {
    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        ContentType: contentType,
      }),
      { expiresIn: expiresInSeconds },
    );
    return {
      provider: this.name,
      path,
      uploadUrl,
      headers: { "Content-Type": contentType },
    };
  }
}

let provider: PrivateStorageProvider | undefined;

export function getPrivateStorage() {
  if (!provider) {
    provider =
      process.env.STORAGE_PROVIDER?.trim().toLowerCase() === "r2"
        ? new R2StorageProvider()
        : new SupabaseStorageProvider();
  }
  return provider;
}
