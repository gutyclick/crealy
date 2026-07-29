export type ContentType =
  | "youtube-thumbnail"
  | "social-post"
  | "banner"
  | "social-cover";

export type GenerationFormat =
  | "youtube-16-9"
  | "social-square"
  | "social-portrait"
  | "banner-3-1"
  | "facebook-cover"
  | "x-cover"
  | "linkedin-cover"
  // Kept so existing database rows remain readable.
  | "social-cover-panorama";

export type GenerationStyle =
  | "auto"
  | "photographic"
  | "illustration"
  | "minimal"
  | "cinematic"
  | "advertising";

export type ColorPreference =
  | "auto"
  | "dark"
  | "vibrant"
  | "warm"
  | "cool"
  | "custom";

export type GenerationQuality = "fast" | "high";

export type GenerationInput = {
  clientRequestId: string;
  projectId?: string;
  contentType: ContentType;
  description: string;
  primaryText?: string;
  style: GenerationStyle;
  colorPreference: ColorPreference;
  customColors?: string[];
  format: GenerationFormat;
  quality: GenerationQuality;
  referenceUploadIds?: string[];
};

export type GenerationReferenceImage = {
  buffer: Buffer;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  filename: string;
};

export type GenerationResponse = {
  generationId: string;
  projectId: string;
  status: "completed";
  imageUrl: string;
  width: number | null;
  height: number | null;
  creditsUsed: number;
  creditsRemaining: number;
};

export type GenerationErrorResponse = {
  error: string;
  code:
    | "invalid_request"
    | "unauthorized"
    | "generation_disabled"
    | "generation_active"
    | "generation_limit"
    | "generation_cooldown"
    | "generation_in_progress"
    | "insufficient_credits"
    | "invalid_reference"
    | "provider_error"
    | "storage_error"
    | "internal_error";
  fields?: Record<string, string>;
};

export type GenerationStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type GenerationListItem = {
  id: string;
  projectId: string;
  projectTitle: string;
  contentType: ContentType;
  format: GenerationFormat;
  status: GenerationStatus;
  imageUrl: string | null;
  createdAt: string;
};
