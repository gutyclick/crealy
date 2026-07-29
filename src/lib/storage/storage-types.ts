export type StorageProviderName = "supabase" | "r2";

export type StorageObjectMetadata = {
  size: number;
  contentType: string | null;
};

export type SignedUploadIntent =
  | { provider: "supabase"; path: string; token: string }
  | {
      provider: "r2";
      path: string;
      uploadUrl: string;
      headers: { "Content-Type": string; "If-None-Match": "*" };
    };

export interface PrivateStorageProvider {
  readonly name: StorageProviderName;
  readonly bucket: string;
  get(path: string): Promise<Buffer | null>;
  head(path: string): Promise<StorageObjectMetadata | null>;
  put(path: string, body: Buffer, contentType: string): Promise<void>;
  remove(path: string): Promise<void>;
  signDownload(path: string, expiresInSeconds: number): Promise<string | null>;
  signUpload(path: string, contentType: string, expiresInSeconds: number): Promise<SignedUploadIntent>;
}
