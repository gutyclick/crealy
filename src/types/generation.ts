export type ContentType =
  | "thumbnail"
  | "social-post"
  | "banner"
  | "social-cover"
  | "story"
  | "profile-image";

export type LegacyContentType = "youtube-thumbnail";

export type CoverPlatform = "youtube" | "facebook" | "x" | "linkedin";
export type StoryPlatform = "instagram" | "facebook" | "tiktok" | "generic";
export type ProfilePlatform = "instagram" | "facebook" | "x" | "linkedin";
export type GenerationPlatform =
  | CoverPlatform
  | StoryPlatform
  | ProfilePlatform;

export type GenerationFormat =
  | "thumbnail-standard"
  | "thumbnail-high"
  | "post-square"
  | "post-portrait"
  | "banner-small"
  | "banner-standard"
  | "banner-large"
  | "banner-2k"
  | "cover-youtube"
  | "cover-facebook"
  | "cover-x"
  | "cover-linkedin"
  | "story-standard"
  | "story-high"
  | "profile-master"
  // Legacy values remain readable while existing rows are migrated lazily.
  | "youtube-16-9"
  | "youtube-cover"
  | "social-square"
  | "social-portrait"
  | "banner-3-1"
  | "facebook-cover"
  | "x-cover"
  | "linkedin-cover"
  | "social-cover-panorama";

export type GenerationStyle =
  | "automatic"
  | "viral"
  | "gamer"
  | "sports"
  | "minimal"
  | "professional"
  | "podcast"
  | "cinematic"
  | "corporate"
  | "educational"
  | "technology"
  | "luxury"
  | "news"
  | "promotional"
  | "fashion"
  | "food"
  | "event"
  // Historical values.
  | "auto"
  | "photographic"
  | "illustration"
  | "advertising";

export type ColorPreference =
  | "auto"
  | "dark"
  | "vibrant"
  | "warm"
  | "cool"
  | "custom";

export type ColorMode = "automatic" | "preset" | "custom";
export type GenerationQuality = "standard" | "high";
export type LegacyGenerationQuality = "fast";
export type ThumbnailPreset =
  | "impactful"
  | "curiosity"
  | "result"
  | "comparison"
  | "minimal"
  | "cinematic";
export type ThumbnailTextMode = "automatic" | "custom" | "none";
export type StyleConsistency = "flexible" | "balanced" | "strict";
export type ThumbnailNiche =
  | "technology_ai"
  | "finance_business"
  | "gaming"
  | "education"
  | "productivity"
  | "fitness_health"
  | "entertainment"
  | "travel"
  | "beauty_lifestyle"
  | "reactions_news"
  | "general";
export type ThumbnailArchetype =
  | "result"
  | "curiosity"
  | "comparison"
  | "warning"
  | "transformation"
  | "extreme_moment";
export type ThumbnailConceptStrategy = "clarity" | "emotion" | "curiosity";

export type ThumbnailConcept = {
  strategy: ThumbnailConceptStrategy;
  archetype: ThumbnailArchetype;
  concept: string;
  thumbnailText: string;
  mainSubject: string;
  composition: string;
  score: number;
};

export type ThumbnailCreativePlan = {
  detectedNiche: ThumbnailNiche;
  nicheConfidence: number;
  brief: {
    topic: string;
    videoTitle: string;
    niche: ThumbnailNiche;
    contentType: string;
    audience: string;
    mainPromise: string;
    primaryEmotion: string;
    secondaryEmotion: string;
    mainSubject: string;
    supportingObject: string;
    recommendedText: string;
    visualPriority: string;
    avoid: string[];
  };
  concepts: ThumbnailConcept[];
  selectedConcept: ThumbnailConcept;
  finalPrompt: string;
};

export type ThumbnailEvaluation = {
  approved: boolean;
  score: number;
  criticalErrors: string[];
  problems: string[];
  corrections: string[];
};

export type ProfileMode =
  | "enhance"
  | "professional"
  | "black-and-white"
  | "creative"
  | "illustrated"
  | "studio"
  | "brand";
export type ProfileIntensity = "subtle" | "balanced" | "creative";
export type ProfileBackground =
  | "auto"
  | "white"
  | "black"
  | "neutral"
  | "custom"
  | "gradient";

export type GenerationInput = {
  clientRequestId: string;
  projectId?: string;
  contentType: ContentType;
  platform?: GenerationPlatform;
  coverPlatform?: CoverPlatform;
  description: string;
  primaryText?: string;
  style: GenerationStyle;
  colorPreference: ColorPreference;
  customColors?: string[];
  variant: GenerationFormat;
  format: GenerationFormat;
  quality: GenerationQuality;
  referenceUploadIds?: string[];
  profileMode?: ProfileMode;
  profileIntensity?: ProfileIntensity;
  profileBackground?: ProfileBackground;
  showSafeArea?: boolean;
  videoTitle?: string;
  thumbnailPreset?: ThumbnailPreset;
  thumbnailTextMode?: ThumbnailTextMode;
  generationIntent?: "initial" | "variation" | "additional_concept";
  parentGenerationId?: string;
  brandStyleId?: string;
  styleConsistency?: StyleConsistency;
  creationMode?: "create" | "recreate";
  recreateSimilarity?: import("@/types/recreate").RecreateSimilarity;
  recreateBlueprint?: import("@/types/recreate").RecreateBlueprint;
  recreateFocus?: import("@/types/recreate").RecreateFocus;
  recreateGoal?: import("@/types/recreate").RecreateGoal;
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
  platform: GenerationPlatform | null;
  coverPlatform: CoverPlatform | null;
  format: GenerationFormat;
  quality: GenerationQuality;
  creditCost: number | null;
  status: GenerationStatus;
  imageUrl: string | null;
  createdAt: string;
};
